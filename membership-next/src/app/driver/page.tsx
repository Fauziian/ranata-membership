"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Compass, 
  Radio, 
  CheckCircle2, 
  LogOut, 
  AlertTriangle,
  User,
  Clock
} from "lucide-react";
import { adminApi, getToken, removeToken } from "@/lib/api";
import { toast } from "sonner";

interface TripStep {
  id: number;
  label: string;
  officer: string;
  time: string;
  status: "waiting" | "in-progress" | "done";
  driver_lat: string | null;
  driver_lng: string | null;
}

interface Trip {
  id: number;
  title: string;
  description: string;
  status: string;
  user: {
    name: string;
    phone: string;
    city: string;
    address: string;
  };
  steps: TripStep[];
}

export default function DriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [activeGpsStepId, setActiveGpsStepId] = useState<number | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch all trips using adminApi (auth token must be present and user must be admin)
  const fetchTrips = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminApi.getTrips();
      if (res.success && res.data) {
        // Only show trips that are not completely done
        const activeTrips = res.data.filter((t: Trip) => t.status !== "done");
        setTrips(activeTrips);
        
        // Auto-select first trip if none is selected
        if (activeTrips.length > 0 && !selectedTripId) {
          setSelectedTripId(activeTrips[0].id);
        }
      }
    } catch (e: any) {
      console.error(e);
      // Access denied / Unauthenticated
      if (e?.status === 403 || e?.status === 401) {
        toast.error("Akses ditolak. Silakan login sebagai Admin/Driver.");
        router.push("/auth?redirect=/driver");
      } else {
        toast.error("Gagal mengambil data penjemputan.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("Silakan masuk terlebih dahulu.");
      router.push("/auth?redirect=/driver");
      return;
    }
    fetchTrips();

    // Refresh trips data every 10 seconds
    const interval = setInterval(() => fetchTrips(true), 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle Geolocation Live Streaming
  useEffect(() => {
    if (!activeGpsStepId) {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      setCurrentCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung deteksi GPS/Geolokasi.");
      setActiveGpsStepId(null);
      return;
    }

    toast.info("Memulai pencarian GPS ponsel...");
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        try {
          // Update status in db along with coordinates
          await adminApi.updateTripStepStatus(activeGpsStepId, "in-progress", { lat, lng });
        } catch (e) {
          console.error("Gagal update GPS ke server:", e);
        }
      },
      (err) => {
        toast.error("Gagal mendapatkan koordinat GPS: " + err.message);
        setActiveGpsStepId(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, [activeGpsStepId]);

  const handleUpdateStep = async (stepId: number, status: "waiting" | "in-progress" | "done") => {
    try {
      const res = await adminApi.updateTripStepStatus(stepId, status, currentCoords || undefined);
      if (res.success) {
        toast.success(`Status tahapan berhasil diubah menjadi: ${status === "in-progress" ? "Jalan" : status === "done" ? "Selesai" : "Menunggu"}`);
        fetchTrips(true);
      } else {
        toast.error("Gagal memperbarui status tahapan.");
      }
    } catch {
      toast.error("Gagal memperbarui status tahapan.");
    }
  };

  const handleLogout = () => {
    removeToken();
    toast.success("Berhasil keluar.");
    router.push("/auth?redirect=/driver");
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#800000] to-[#500000] border-b border-white/10 px-5 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-[#DAA520] animate-pulse" />
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
              RANATA DRIVER PORTAL
            </h1>
            <p className="text-[10px] text-white/70 font-semibold">Live GPS Tracker & Navigator</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          title="Keluar"
        >
          <LogOut className="w-4 h-4 text-white" />
        </button>
      </header>

      {/* ── BODY ── */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 font-medium">Memuat data perjalanan...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center shadow-md space-y-3">
            <Compass className="w-12 h-12 mx-auto text-[#DAA520] opacity-40 animate-spin" style={{ animationDuration: "6s" }} />
            <h3 className="text-sm font-bold text-slate-200">Tidak Ada Tugas Penjemputan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Saat ini tidak ada perjalanan berstatus aktif di sistem. Pastikan admin kantor telah mengaktifkan pesanan member.
            </p>
            <button 
              onClick={() => fetchTrips()} 
              className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors"
            >
              Segarkan Halaman
            </button>
          </div>
        ) : (
          <>
            {/* Trip Selector Dropdown */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-md">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pilih Tugas Penjemputan / Perjalanan
              </label>
              <select
                value={selectedTripId ?? ""}
                onChange={(e) => {
                  setSelectedTripId(Number(e.target.value));
                  setActiveGpsStepId(null);
                }}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#DAA520] transition-colors"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user?.name} — {t.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedTrip && (
              <div className="space-y-4">
                {/* Customer Details Card */}
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-4 shadow-md space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                    <User className="w-4 h-4 text-[#DAA520]" />
                    <span className="text-xs font-bold text-slate-200">Informasi Pelanggan</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Nama Pelanggan</div>
                      <div className="text-sm font-black text-white">{selectedTrip.user?.name}</div>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={`tel:${selectedTrip.user?.phone}`} 
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors w-fit"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Hubungi via Telepon
                      </a>
                      <a 
                        href={`https://wa.me/${selectedTrip.user?.phone?.replace(/^0/, "62")}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors w-fit"
                      >
                        WhatsApp
                      </a>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-[#DAA520]" /> Alamat Penjemputan ({selectedTrip.user?.city})
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 mt-1">
                        {selectedTrip.user?.address || "Belum diisi oleh pelanggan."}
                      </div>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTrip.user?.address + " " + selectedTrip.user?.city)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#DAA520] hover:underline font-bold"
                      >
                        🧭 Buka Navigasi Google Maps ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* GPS Transmitter Card */}
                <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl p-4 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className={`w-4 h-4 ${activeGpsStepId ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
                      <span className="text-xs font-bold text-slate-200">Pengirim GPS Live</span>
                    </div>
                    {activeGpsStepId ? (
                      <span className="bg-emerald-950 border border-emerald-500 text-emerald-400 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase animate-pulse">
                        LIVE TRANSMITTING
                      </span>
                    ) : (
                      <span className="bg-slate-950 border border-slate-700 text-slate-500 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                        STANDBY
                      </span>
                    )}
                  </div>

                  {activeGpsStepId ? (
                    <div className="bg-emerald-950/30 border border-emerald-900 rounded-2xl p-3 text-center space-y-2">
                      <p className="text-xs text-emerald-400 font-semibold">
                        GPS ponsel Anda saat ini terhubung & mengirimkan lokasi secara real-time ke aplikasi pelanggan.
                      </p>
                      {currentCoords && (
                        <div className="text-[10px] font-mono text-emerald-500 bg-emerald-950/60 py-1 px-2 rounded-lg inline-block">
                          Lat: {currentCoords.lat.toFixed(6)} | Lng: {currentCoords.lng.toFixed(6)}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 justify-center text-[9px] text-amber-500 font-bold bg-amber-950/35 border border-amber-900 rounded-xl p-2 mt-1">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Jangan tutup atau kunci layar ponsel Anda agar GPS terus berjalan.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-750 rounded-2xl p-3 text-center text-xs text-slate-400">
                      Aktifkan tombol "Mulai Penjemputan" di bawah untuk menyalakan pemancar koordinat GPS Anda.
                    </div>
                  )}
                </div>

                {/* Journey Steps & Controls */}
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-4 shadow-md space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Clock className="w-4 h-4 text-[#DAA520]" />
                    <span className="text-xs font-bold text-slate-200">Alur Tahapan Penjemputan</span>
                  </div>

                  <div className="space-y-3">
                    {selectedTrip.steps?.map((step) => {
                      const isWaiting = step.status === "waiting";
                      const isInProgress = step.status === "in-progress";
                      const isDone = step.status === "done";
                      
                      return (
                        <div 
                          key={step.id} 
                          className={`rounded-2xl p-3 border transition-colors ${
                            isInProgress 
                              ? "bg-slate-900 border-[#DAA520]/60 shadow-md" 
                              : "bg-slate-850 border-slate-750"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <div>
                              <div className="text-xs font-black text-white">{step.label}</div>
                              <div className="text-[9px] text-slate-400 font-semibold">{step.officer || "Driver"} • {step.time}</div>
                            </div>
                            <span 
                              className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isDone 
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-700" 
                                  : isInProgress 
                                    ? "bg-amber-950 text-amber-400 border border-amber-600 animate-pulse" 
                                    : "bg-slate-900 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {isDone ? "Selesai" : isInProgress ? "Jalan" : "Menunggu"}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {isWaiting && (
                              <button
                                onClick={() => {
                                  handleUpdateStep(step.id, "in-progress");
                                  setActiveGpsStepId(step.id);
                                }}
                                className="col-span-2 w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                              >
                                🟡 Mulai Perjalanan / Jemput
                              </button>
                            )}

                            {isInProgress && (
                              <>
                                <button
                                  onClick={() => {
                                    if (activeGpsStepId === step.id) {
                                      setActiveGpsStepId(null);
                                    } else {
                                      setActiveGpsStepId(step.id);
                                    }
                                  }}
                                  className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                    activeGpsStepId === step.id
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-slate-800 text-emerald-400 border-emerald-500/50 hover:bg-slate-700"
                                  }`}
                                >
                                  {activeGpsStepId === step.id ? "⏸ Matikan GPS" : "📡 Aktifkan GPS"}
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveGpsStepId(null);
                                    handleUpdateStep(step.id, "done");
                                  }}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-white rounded-xl text-[10px] font-bold transition-all shadow-md active:scale-95"
                                >
                                  ✅ Selesaikan Tahap Ini
                                </button>
                              </>
                            )}

                            {isDone && (
                              <button
                                onClick={() => handleUpdateStep(step.id, "in-progress")}
                                className="col-span-2 w-full py-1.5 bg-slate-750 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-semibold transition-colors"
                              >
                                ↩️ Ubah kembali ke Jalan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
