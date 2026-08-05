"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  RefreshCw, MapPin, Navigation, User, Clock, CheckCircle2,
  AlertCircle, Truck, Phone, Info, ChevronRight, Radio, Wifi,
  WifiOff, ZoomIn, Filter
} from "lucide-react";
import { adminApi } from "@/lib/api";
import type { TravelStatus } from "@/types";
import { toast } from "sonner";

// Leaflet must be client-only
const AdminTrackingMap = dynamic(() => import("./AdminTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs text-slate-500 font-semibold">Memuat peta tracking...</span>
    </div>
  ),
});

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_COLOR = { waiting: "#EF4444", "in-progress": "#F59E0B", done: "#22C55E" } as const;
const STATUS_LABEL = { waiting: "Menunggu", "in-progress": "In-Progress", done: "Selesai" } as const;

function formatETA(seconds: number) {
  if (seconds <= 60) return "< 1 mnt";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60); const r = m % 60;
  return r > 0 ? `${h}j ${r}m` : `${h} jam`;
}
function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Stepper steps config ─────────────────────────────────────────────────────

function buildStepper(steps: any[]) {
  if (!steps?.length) return [];
  return steps.map((s: any) => ({
    id: s.id,
    label: s.label,
    sublabel: s.officer ? `Petugas: ${s.officer}` : undefined,
    status: s.status as "waiting" | "in-progress" | "done",
  }));
}

// ─── City coord lookup (minimal, same as map) ─────────────────────────────────

const CITIES: Record<string, [number, number]> = {
  jakarta: [-6.2088, 106.8456], bogor: [-6.5971, 106.806], depok: [-6.4025, 106.7942],
  tangerang: [-6.1783, 106.6319], bekasi: [-6.2383, 106.9756], bandung: [-6.9175, 107.6191],
  surabaya: [-7.2575, 112.7521], yogyakarta: [-7.7956, 110.3695], bali: [-8.4095, 115.1889],
  denpasar: [-8.6705, 115.2126], medan: [3.5952, 98.6722], makassar: [-5.1477, 119.4327],
};
function cityCoords(city?: string): [number, number] {
  const k = (city || "").toLowerCase().trim();
  return CITIES[k] ?? [-6.2088, 106.8456];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMapPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [activeGpsStepId, setActiveGpsStepId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<"all" | "in-progress" | "waiting">("all");
  const gpsWatchRef = useRef<number | null>(null);

  // ── Fetch trips ──────────────────────────────────────────────────────────────

  const fetchTrips = useCallback(async (showToast = false) => {
    try {
      const res = await adminApi.getTrips();
      if (res.success) {
        setTrips(res.data ?? []);
        setLastRefresh(new Date());
        setIsOnline(true);
        if (showToast) toast.success("Data perjalanan diperbarui!");
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
      if (showToast) toast.error("Gagal memuat data. Periksa koneksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
    const iv = setInterval(() => fetchTrips(), 8000);
    return () => clearInterval(iv);
  }, [fetchTrips]);

  // ── GPS driver tracking ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeGpsStepId) {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung GPS.");
      setActiveGpsStepId(null);
      return;
    }
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await adminApi.updateTripStepStatus(activeGpsStepId, "in-progress", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } catch { /* silent */ }
      },
      (err) => {
        toast.error("GPS error: " + err.message);
        setActiveGpsStepId(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, [activeGpsStepId]);

  // ── Step status update ───────────────────────────────────────────────────────

  const updateStep = async (stepId: number, status: string) => {
    try {
      const res = await adminApi.updateTripStepStatus(stepId, status);
      if (res.success) {
        toast.success("Status diperbarui!");
        fetchTrips();
      } else toast.error("Gagal memperbarui.");
    } catch { toast.error("Gagal memperbarui."); }
  };

  // ── Map travelers payload ─────────────────────────────────────────────────────

  const travelers = trips.map((trip: any) => {
    const activeStep = trip.steps?.find((s: any) => s.status === "in-progress")
      || trip.steps?.filter((s: any) => s.status === "done").slice(-1)[0]
      || trip.steps?.[0];
    const [defLat, defLng] = cityCoords(trip.user?.city);
    return {
      id: trip.id,
      name: trip.user?.name || "Customer",
      service: trip.title,
      status: trip.status,
      lat: trip.user?.latitude ?? defLat,
      lng: trip.user?.longitude ?? defLng,
      userLat: trip.user?.latitude ?? null,
      userLng: trip.user?.longitude ?? null,
      userCity: trip.user?.city,
      userAddress: trip.user?.address,
      activeStep: activeStep ? {
        label: activeStep.label,
        status: activeStep.status,
        officer: activeStep.officer,
        time: activeStep.time,
        driverLat: activeStep.driver_lat,
        driverLng: activeStep.driver_lng,
      } : null,
    };
  });

  const filteredTrips = trips.filter(t =>
    filterStatus === "all" ? true : t.status === filterStatus
  );
  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // ── Driver ETA for selected trip ─────────────────────────────────────────────

  let etaS = 0, distM = 0;
  if (selectedTrip) {
    const active = selectedTrip.steps?.find((s: any) => s.status === "in-progress");
    if (active) {
      const dLat = selectedTrip.user?.latitude ?? cityCoords(selectedTrip.user?.city)[0];
      const dLng = selectedTrip.user?.longitude ?? cityCoords(selectedTrip.user?.city)[1];
      const vLat = active.driver_lat ? Number(active.driver_lat) : -6.125;
      const vLng = active.driver_lng ? Number(active.driver_lng) : 106.656;
      const distKm = haversineKm(vLat, vLng, dLat, dLng);
      distM = distKm * 1000;
      etaS = distM / (40 / 3.6);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* ── TOP BAR ── */}
      <div
        className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}
      >
        <div className="flex items-center justify-between px-5 py-3 gap-3">
          <div>
            <h1 className="text-lg font-black text-foreground" style={{ fontFamily: "Montserrat,sans-serif" }}>
              Pemantauan Posisi Live
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Real-time tracking penjemputan &amp; pengiriman Ranata Tour
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Online indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border ${isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <button
              onClick={() => fetchTrips(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white hover:bg-secondary/40 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 grid lg:grid-cols-[1fr_380px] gap-0 overflow-hidden">

        {/* ── LEFT: MAP ── */}
        <div className="relative flex flex-col p-4 bg-background min-h-[520px]">
          <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-md"
            style={{ minHeight: 480 }}>
            {loading ? (
              <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl">
                <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs text-slate-500">Memuat peta...</span>
              </div>
            ) : (
              <AdminTrackingMap travelers={travelers} selectedId={selectedTripId} />
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <div className="w-6 h-1 bg-[#DC2626] rounded-full" /> Rute sisa
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <div className="w-6 h-1 bg-[#DC2626] rounded-full opacity-20" /> Sudah dilalui
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <span>🚌</span> Driver
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <span>🏠</span> Tujuan
            </div>
            <div className="ml-auto text-[9px] text-muted-foreground">
              Update: {lastRefresh.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: PANEL ── */}
        <div className="border-l border-border flex flex-col bg-white overflow-hidden">

          {/* Filter bar */}
          <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground mr-1">Filter:</span>
            {(["all", "in-progress", "waiting"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${filterStatus === f
                  ? "bg-[#800000] text-white border-[#800000]"
                  : "bg-white text-muted-foreground border-border hover:bg-secondary/40"}`}
              >
                {f === "all" ? "Semua" : f === "in-progress" ? "In-Progress" : "Menunggu"}
              </button>
            ))}
          </div>

          {/* Trip list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredTrips.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                Tidak ada perjalanan aktif.
              </div>
            ) : (
              filteredTrips.map((trip: any) => {
                const isSelected = selectedTripId === trip.id;
                const color = STATUS_COLOR[trip.status as TravelStatus] ?? "#9CA3AF";
                const label = STATUS_LABEL[trip.status as TravelStatus] ?? "Unknown";
                const active = trip.steps?.find((s: any) => s.status === "in-progress");
                const stepper = buildStepper(trip.steps || []);

                return (
                  <div
                    key={trip.id}
                    className={`transition-colors ${isSelected ? "bg-red-50 border-l-4 border-[#800000]" : "hover:bg-secondary/10"}`}
                  >
                    {/* Trip header row — click to expand */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={() => setSelectedTripId(isSelected ? null : trip.id)}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: color }}
                      >
                        {trip.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{trip.user?.name ?? "Customer"}</div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          {trip.user?.city ?? "Belum diatur"}
                        </div>
                        {active && (
                          <div className="text-[9px] text-[#800000] font-semibold mt-0.5 truncate">{active.label}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: color }}>
                          {label}
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isSelected && (
                      <div className="px-4 pb-4 space-y-4">

                        {/* ETA Card (if active step) */}
                        {active && (
                          <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-3">
                            <div className="text-[9px] font-black tracking-widest text-[#DC2626] mb-2" style={{ fontFamily: "Montserrat,sans-serif" }}>
                              ESTIMASI PENJEMPUTAN
                            </div>
                            <div className="text-sm font-black text-foreground">
                              {active.driver_lat ? (
                                <>
                                  ⏱ {formatETA(etaS)}&nbsp;
                                  <span className="text-[10px] font-normal text-muted-foreground">
                                    ({formatDist(distM)} tersisa)
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground font-normal">Menunggu GPS driver aktif...</span>
                              )}
                            </div>
                            {active.driver_lat && (
                              <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                                <Radio className="w-2.5 h-2.5 animate-pulse" />
                                GPS Live aktif — rute snap-to-road
                              </div>
                            )}
                          </div>
                        )}

                        {/* Progress Stepper */}
                        <div>
                          <div className="text-[9px] font-black tracking-widest text-muted-foreground mb-2.5" style={{ fontFamily: "Montserrat,sans-serif" }}>
                            PROGRES PERJALANAN
                          </div>
                          <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                            <div className="space-y-0">
                              {stepper.map((step, idx) => {
                                const isDone = step.status === "done";
                                const isInProgress = step.status === "in-progress";
                                const isWaiting = step.status === "waiting";
                                return (
                                  <div key={step.id} className="flex gap-3 relative">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 mt-0.5 ${isDone ? "bg-emerald-500 border-emerald-500" : isInProgress ? "bg-amber-500 border-amber-500 animate-pulse" : "bg-white border-border"}`}>
                                      {isDone ? (
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                      ) : isInProgress ? (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-border" />
                                      )}
                                    </div>
                                    <div className={`flex-1 pb-3 ${idx === stepper.length - 1 ? "" : ""}`}>
                                      <div className={`text-xs font-bold ${isDone ? "text-emerald-700" : isInProgress ? "text-amber-700" : "text-muted-foreground"}`}>
                                        {step.label}
                                      </div>
                                      {step.sublabel && (
                                        <div className="text-[9px] text-muted-foreground mt-0.5">{step.sublabel}</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Driver Info */}
                        {active && (
                          <div className="rounded-xl border border-border bg-secondary/20 p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#800000] flex items-center justify-center flex-shrink-0">
                              <Truck className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold">{active.officer ?? "Driver Lapangan"}</div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">{active.label}</div>
                              {active.driver_lat && active.driver_lng && (
                                <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                                  📍 {Number(active.driver_lat).toFixed(5)}, {Number(active.driver_lng).toFixed(5)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step controls */}
                        <div>
                          <div className="text-[9px] font-black tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "Montserrat,sans-serif" }}>
                            UPDATE STATUS TAHAPAN
                          </div>
                          <div className="space-y-2">
                            {trip.steps?.map((step: any) => (
                              <div key={step.id} className="rounded-xl border border-border bg-white p-2.5">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-[10px] font-bold truncate">{step.label}</div>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white" style={{ background: STATUS_COLOR[step.status as TravelStatus] }}>
                                    {STATUS_LABEL[step.status as TravelStatus]}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  {(["waiting", "in-progress", "done"] as const).map(s => (
                                    <button
                                      key={s}
                                      onClick={() => updateStep(step.id, s)}
                                      className={`py-1 rounded text-[8px] font-bold border transition-colors ${step.status === s
                                        ? "text-white border-transparent"
                                        : "bg-white border-border text-muted-foreground hover:bg-secondary/40"}`}
                                      style={step.status === s ? { background: STATUS_COLOR[s] } : {}}
                                    >
                                      {s === "waiting" ? "🔴 Tunggu" : s === "in-progress" ? "🟡 Jalan" : "🟢 Selesai"}
                                    </button>
                                  ))}
                                </div>

                                {/* GPS activation for in-progress step */}
                                {step.status === "in-progress" && (
                                  <button
                                    onClick={() => {
                                      if (activeGpsStepId === step.id) {
                                        setActiveGpsStepId(null);
                                        toast.success("GPS driver dinonaktifkan.");
                                      } else {
                                        setActiveGpsStepId(step.id);
                                        toast.success("GPS driver diaktifkan — rute akan mengikuti jalan asli!");
                                      }
                                    }}
                                    className={`mt-1.5 w-full py-1.5 px-3 rounded-lg text-[9px] font-black border transition-all flex items-center justify-center gap-1.5 ${activeGpsStepId === step.id
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"}`}
                                  >
                                    <Radio className={`w-3 h-3 ${activeGpsStepId === step.id ? "animate-pulse" : ""}`} />
                                    {activeGpsStepId === step.id
                                      ? "GPS Aktif — Mengirim Lokasi Live..."
                                      : "Aktifkan GPS Penjemput (Kirim Lokasi)"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer summary */}
          <div className="p-3 border-t border-border bg-secondary/10 flex-shrink-0">
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
              <span>Total: <strong className="text-foreground">{trips.length}</strong></span>
              <span>In-Progress: <strong className="text-amber-600">{trips.filter(t => t.status === "in-progress").length}</strong></span>
              <span>Selesai: <strong className="text-emerald-600">{trips.filter(t => t.status === "done").length}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
