"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, MapPin, Navigation, User, ChevronRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { TravelStatus } from "@/types";
import { toast } from "sonner";

// Dynamically import the Leaflet Map component to prevent SSR reference errors
const IndonesiaMap = dynamic(() => import("../../dashboard/perjalanan/IndonesiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-secondary/35 rounded-3xl flex flex-col items-center justify-center border border-border animate-pulse">
      <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-3"></div>
      <span className="text-xs text-muted-foreground font-semibold">Memuat Peta Pemantauan...</span>
    </div>
  )
});

export default function AdminMapPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const fetchTripsData = async (showToast = false) => {
    try {
      const res = await adminApi.getTrips();
      if (res.success) {
        setTrips(res.data);
        if (showToast) {
          toast.success("Peta pemantauan berhasil diperbarui!");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengambil data pemantauan perjalanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsData();
    // Poll every 10 seconds for real-time live monitoring
    const interval = setInterval(() => fetchTripsData(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStepStatus = async (stepId: number, status: string) => {
    try {
      const res = await adminApi.updateTripStepStatus(stepId, status);
      if (res.success) {
        toast.success("Status tahapan berhasil diperbarui!");
        // Refresh local trips data
        fetchTripsData(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui status tahapan.");
    }
  };

  const statusColorMap = {
    waiting: "#EF4444",
    "in-progress": "#F59E0B",
    done: "#22C55E"
  };

  const statusLabelMap = {
    waiting: "Menunggu",
    "in-progress": "In-Progress",
    done: "Selesai"
  };

  // Coordinate map for major cities in Indonesia
  const cityCoordinatesMap: Record<string, { lat: number; lng: number }> = {
    jakarta: { lat: -6.2088, lng: 106.8456 },
    bogor: { lat: -6.5971, lng: 106.8060 },
    depok: { lat: -6.4025, lng: 106.7942 },
    tangerang: { lat: -6.1783, lng: 106.6319 },
    bekasi: { lat: -6.2383, lng: 106.9756 },
    bandung: { lat: -6.9175, lng: 107.6191 },
    surabaya: { lat: -7.2575, lng: 112.7521 },
    semarang: { lat: -6.9667, lng: 110.4167 },
    yogyakarta: { lat: -7.7956, lng: 110.3695 },
    jogja: { lat: -7.7956, lng: 110.3695 },
    solo: { lat: -7.5755, lng: 110.8243 },
    malang: { lat: -7.9666, lng: 112.6326 },
    denpasar: { lat: -8.6705, lng: 115.2126 },
    bali: { lat: -8.4095, lng: 115.1889 },
    medan: { lat: 3.5952, lng: 98.6722 },
    makassar: { lat: -5.1477, lng: 119.4327 },
    palembang: { lat: -2.9909, lng: 104.7567 },
    balikpapan: { lat: -1.2654, lng: 116.8312 },
    samarinda: { lat: -0.5022, lng: 117.1536 },
    banjarmasin: { lat: -3.3186, lng: 114.5944 },
    pontianak: { lat: -0.0263, lng: 109.3425 },
    manado: { lat: 1.4748, lng: 124.8428 },
    padang: { lat: -0.9471, lng: 100.4172 },
    pekanbaru: { lat: 0.5071, lng: 101.4478 },
    lampung: { lat: -5.4498, lng: 105.2664 },
    batam: { lat: 1.0901, lng: 104.0301 },
  };

  const getCoordinatesForCity = (city: string, address: string) => {
    const defaultCoords = { lat: -6.2088, lng: 106.8456 }; // Jakarta
    const cleanCity = (city || "").toLowerCase().trim();
    const cleanAddress = (address || "").toLowerCase().trim();
    
    if (cleanCity && cityCoordinatesMap[cleanCity]) {
      return cityCoordinatesMap[cleanCity];
    }
    for (const [cityName, coords] of Object.entries(cityCoordinatesMap)) {
      if (cleanAddress.includes(cityName)) {
        return coords;
      }
    }
    return defaultCoords;
  };

  // Derive location coordinates and name based on the current active step of a trip
  const getActiveLocationForTrip = (t: any) => {
    if (!t || !t.steps || t.steps.length === 0) {
      return { lat: -6.208, lng: 106.822, location: "Menunggu" };
    }
    let activeStep = t.steps.find((s: any) => s.status === "in-progress");
    if (!activeStep) {
      const doneSteps = t.steps.filter((s: any) => s.status === "done");
      if (doneSteps.length > 0) {
        activeStep = doneSteps[doneSteps.length - 1];
      }
    }
    if (!activeStep) {
      activeStep = t.steps[0];
    }
    const stepLabel = activeStep?.label || "";
    if (stepLabel.includes("Rumah")) {
      const userCity = t.user?.city && t.user.city !== "Belum diatur" ? t.user.city : null;
      const locationLabel = userCity ? `Rumah Customer (${userCity})` : "Rumah Customer (Belum diatur)";
      const coords = getCoordinatesForCity(t.user?.city || "", t.user?.address || "");
      return { lat: coords.lat, lng: coords.lng, location: locationLabel };
    } else if (stepLabel.includes("CGK")) {
      return { lat: -6.125, lng: 106.656, location: "Terminal 3 Bandara CGK" };
    } else if (stepLabel.includes("Flight") || stepLabel.includes("Penerbangan")) {
      return { lat: -7.3, lng: 110.8, location: "Di Udara (Flight GA-403)" };
    } else if (stepLabel.includes("DPS") || stepLabel.includes("Bali")) {
      return { lat: -8.748, lng: 115.167, location: "Bandara Ngurah Rai Bali" };
    } else if (stepLabel.includes("Hotel") || stepLabel.includes("Check-in")) {
      return { lat: -8.798, lng: 115.228, location: "Hotel Partner (Bali)" };
    }
    return { lat: -6.208, lng: 106.822, location: activeStep?.label || "Perjalanan" };
  };

  // Map trips to travelers format for leaflet map
  const travelers = trips.map((trip: any) => {
    const activeLoc = getActiveLocationForTrip(trip);
    return {
      id: trip.id,
      name: trip.user?.name || "Customer",
      location: activeLoc.location,
      status: trip.status,
      service: trip.title,
      lat: activeLoc.lat,
      lng: activeLoc.lng,
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Pemantauan Posisi Live
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Real-time tracking posisi traveler Ranata Tour di seluruh wilayah destinasi
          </p>
        </div>
        
        <button 
          onClick={() => fetchTripsData(true)}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-white hover:bg-secondary/40 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Posisi
        </button>
      </div>

      {/* Map Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Map Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Peta Monitoring Lokasi (Leaflet)
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Menunggu
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> In-Progress
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" /> Selesai
                </div>
              </div>
            </div>
            
            {/* Dynamic Map Component */}
            {travelers.length > 0 ? (
              <IndonesiaMap 
                travelers={travelers} 
                onStatusChange={(id, status) => {
                  setSelectedTripId(id);
                  toast.info("Detail tahapan perjalanan dimuat pada panel sebelah kanan.");
                }} 
              />
            ) : (
              <div className="w-full h-[450px] bg-secondary/35 rounded-3xl flex flex-col items-center justify-center border border-border animate-pulse">
                <span className="text-xs text-muted-foreground">Memuat Peta Pemantauan...</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Status List */}
        <div className="bg-white rounded-3xl border border-border overflow-hidden flex flex-col shadow-xs min-h-[525px]">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Daftar Perjalanan Aktif
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Pilih perjalanan untuk memperbarui status detail petugas lapangan secara langsung
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border pr-1">
            {trips.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada perjalanan aktif di database.
              </div>
            ) : (
              trips.map((trip: any) => {
                const activeLoc = getActiveLocationForTrip(trip);
                const color = statusColorMap[trip.status as TravelStatus] || "#9CA3AF";
                const label = statusLabelMap[trip.status as TravelStatus] || "Unknown";
                const isSelected = selectedTripId === trip.id;
                
                return (
                  <div key={trip.id} className={`p-4 transition-colors ${isSelected ? 'bg-amber-50/20 border-l-4 border-[#800000]' : 'hover:bg-secondary/15'}`}>
                    <div 
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => setSelectedTripId(isSelected ? null : trip.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{trip.user?.name || "Customer"}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted-foreground/80 flex-shrink-0" />
                          <span className="truncate">{activeLoc.location}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Navigation className="w-3 h-3 text-muted-foreground/80 flex-shrink-0" />
                          <span className="truncate">{trip.title}</span>
                        </div>
                      </div>

                      <div 
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-bold text-white flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {label}
                      </div>
                    </div>

                    {/* Step details dropdown when clicked */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Update Tahapan Lapangan:</div>
                        {trip.steps.map((step: any) => {
                          return (
                            <div key={step.id} className="bg-secondary/25 rounded-xl p-3 border border-border flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-xs font-bold text-foreground">{step.label}</div>
                                  <div className="text-[9px] text-muted-foreground mt-0.5">Petugas: {step.officer || '-'}</div>
                                  <div className="text-[9px] text-muted-foreground">Waktu: {step.time || '-'}</div>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white`} style={{ backgroundColor: statusColorMap[step.status as TravelStatus] }}>
                                  {statusLabelMap[step.status as TravelStatus]}
                                </span>
                              </div>
                              
                              {/* Action buttons to update status */}
                              <div className="grid grid-cols-3 gap-1">
                                <button 
                                  onClick={() => handleUpdateStepStatus(step.id, 'waiting')}
                                  className={`py-1 rounded text-[8px] font-bold border transition-colors ${step.status === 'waiting' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
                                >
                                  🔴 Menunggu
                                </button>
                                <button 
                                  onClick={() => handleUpdateStepStatus(step.id, 'in-progress')}
                                  className={`py-1 rounded text-[8px] font-bold border transition-colors ${step.status === 'in-progress' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'}`}
                                >
                                  🟡 In-Progress
                                </button>
                                <button 
                                  onClick={() => handleUpdateStepStatus(step.id, 'done')}
                                  className={`py-1 rounded text-[8px] font-bold border transition-colors ${step.status === 'done' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
                                >
                                  🟢 Selesai
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-5 border-t border-border bg-secondary/15">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total Perjalanan: <strong className="text-foreground">{trips.length}</strong></span>
              <span>Aktif: <strong className="text-amber-600">{trips.filter(t => t.status !== "done").length}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
