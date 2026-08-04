"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Clock, Check, Navigation, User, Shield, ChevronRight, RefreshCw, Lock, Sparkles
} from "lucide-react";
import { memberApi, getToken } from "@/lib/api";
import type { TravelStatus } from "@/types";
import { toast } from "sonner";

// Dynamically import map component with SSR disabled
const IndonesiaMap = dynamic(() => import("./IndonesiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-secondary/35 rounded-2xl flex flex-col items-center justify-center border border-border animate-pulse">
      <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-3"></div>
      <span className="text-xs text-muted-foreground font-semibold">Memuat Peta Pemantauan...</span>
    </div>
  )
});

export default function TravelStatusPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("Customer");
  const [userTier, setUserTier] = useState<string>("Bronze");
  const [userProfile, setUserProfile] = useState<any>(null);

  const statusColorMap = {
    waiting: "#EF4444",
    "in-progress": "#F59E0B",
    done: "#22C55E"
  };

  const statusLabelMap = {
    waiting: "Menunggu",
    "in-progress": "Sedang Berlangsung",
    done: "Selesai"
  };

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

  const fetchTravelData = async (showToast = false) => {
    try {
      const profileRes = await memberApi.getProfile();
      if (profileRes.success && profileRes.data) {
        setUserName(profileRes.data.name);
        setUserTier(profileRes.data.tier || "Bronze");
        setUserProfile(profileRes.data);
      }
      const res = await memberApi.getTrips();
      if (res.success) {
        setTrip(res.data);
        if (showToast && res.data) {
          toast.success("Status perjalanan berhasil diperbarui!");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data perjalanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth");
      return;
    }
    fetchTravelData();
    // Poll every 10 seconds for real-time live updates
    const interval = setInterval(() => fetchTravelData(false), 10000);
    return () => clearInterval(interval);
  }, [router]);

  // Read-only click handlers to inform customer
  const handleReadOnlyClick = () => {
    toast.info("Status perjalanan ini diperbarui secara live oleh tim lapangan Ranata Tour.");
  };

  // Derive location coordinates and name based on the current active step
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
      const userCity = userProfile?.city && userProfile.city !== "Belum diatur" ? userProfile.city : null;
      const locationLabel = userCity ? `Rumah Customer (${userCity})` : "Rumah Customer (Belum diatur)";
      const coords = getCoordinatesForCity(userProfile?.city || "", userProfile?.address || "");
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-muted-foreground font-semibold">Memuat Data Perjalanan Live...</p>
      </div>
    );
  }

  const timeline = trip?.steps || [];
  const activeLoc = getActiveLocationForTrip(trip);
  const activeStep = trip?.steps?.find((s: any) => s.status === "in-progress") 
    || trip?.steps?.filter((s: any) => s.status === "done").slice(-1)[0]
    || trip?.steps?.[0];

  const travelers = trip ? [{
    id: trip.id,
    name: userName,
    location: activeLoc.location,
    status: trip.status,
    service: trip.title,
    lat: activeLoc.lat,
    lng: activeLoc.lng,
    activeStep: activeStep ? {
      label: activeStep.label,
      status: activeStep.status,
      officer: activeStep.officer,
      time: activeStep.time,
    } : null,
    userCity: userProfile?.city,
    userAddress: userProfile?.address,
  }] : [];

  const overallStatus = trip?.status || "waiting";
  const overallColor = statusColorMap[overallStatus as TravelStatus] || "#EF4444";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Status Perjalanan Live
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Pantau rute, penjemputan, bandara handling, dan timeline perjalanan Anda secara langsung
          </p>
        </div>
        {userTier !== "Bronze" && (
          <button
            onClick={() => fetchTravelData(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary/40 transition-colors bg-white shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Status
          </button>
        )}
      </div>

      {/* ─── CASE 1: BRONZE MEMBER (LOCKED FEATURE) ─── */}
      {userTier.toLowerCase() === "bronze" ? (
        <div className="bg-white border border-border rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm my-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500 font-black text-2xl border border-red-100">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Layanan Live Trip Tracking Terkunci
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              Maaf, fitur pemantauan perjalanan live fisik real-time ini hanya tersedia bagi anggota dengan keanggotaan minimal <strong>Silver</strong> ke atas.
            </p>
          </div>

          {/* Benefits Comparison Grid */}
          <div className="grid md:grid-cols-3 gap-4 text-left border-y border-border py-6 my-4">
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-border/80">
              <div className="text-xs font-bold text-slate-700 mb-2">🥈 Silver Benefit</div>
              <ul className="text-[10px] text-muted-foreground space-y-1.5 leading-normal">
                <li>• Sewa Transport ke Bandara</li>
                <li>• Layanan 24/7 Chat</li>
                <li>• Poin & Reward dasar</li>
                <li>• <strong>2 Tahapan Live Tracking</strong></li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
              <div className="text-xs font-bold text-amber-700 mb-2">🥇 Gold Benefit</div>
              <ul className="text-[10px] text-muted-foreground space-y-1.5 leading-normal">
                <li>• Semua benefit Silver</li>
                <li>• Handling Airport penuh</li>
                <li>• Jemput Bandara Tujuan</li>
                <li>• <strong>4 Tahapan Live Tracking</strong></li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
              <div className="text-xs font-bold text-purple-700 mb-2">💎 Platinum Benefit</div>
              <ul className="text-[10px] text-muted-foreground space-y-1.5 leading-normal">
                <li>• Semua benefit Gold</li>
                <li>• VIP Airport & Hotel Handling</li>
                <li>• Check-in diurus tim</li>
                <li>• <strong>5 Tahapan Live Tracking</strong></li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard/membership")}
            className="px-6 py-3 rounded-2xl bg-[#800000] text-white text-xs font-bold hover:bg-[#600000] transition-colors shadow-md flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4 text-white" />
            Upgrade Membership Sekarang
          </button>
        </div>
      ) : (
        /* ─── CASE 2: SILVER / GOLD / PLATINUM (ACTIVE PERMISSIONS) ─── */
        <>
          {/* Dynamic Tier Upsell/Info Banner */}
          {userTier.toLowerCase() === "silver" && (
            <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50/20 text-xs text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <strong>🥈 Tingkat Keanggotaan: Silver</strong> • Fasilitas pelacakan mencakup Sewa Transportasi ke Bandara & Penerbangan. Upgrade ke <strong>Gold</strong> atau <strong>Platinum</strong> untuk mendapatkan airport handling, penjemputan bandara tujuan, serta VIP hotel check-in!
              </div>
              <button 
                onClick={() => router.push("/dashboard/membership")} 
                className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap"
              >
                Upgrade Ke Gold
              </button>
            </div>
          )}

          {userTier.toLowerCase() === "gold" && (
            <div className="mb-6 p-4 rounded-2xl border border-purple-200 bg-purple-50/20 text-xs text-purple-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <strong>🥇 Tingkat Keanggotaan: Gold</strong> • Fasilitas pelacakan mencakup Airport Handling & Transportasi bandara tujuan. Upgrade ke <strong>Platinum</strong> untuk mendapatkan VIP Full Handling + Pengurusan hotel check-in langsung oleh tim kami!
              </div>
              <button 
                onClick={() => router.push("/dashboard/membership")} 
                className="text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-xl transition-colors shrink-0 whitespace-nowrap"
              >
                Upgrade Ke Platinum
              </button>
            </div>
          )}

          {userTier.toLowerCase() === "platinum" && (
            <div className="mb-6 p-4 rounded-2xl border border-green-200 bg-green-50/20 text-xs text-green-800">
              <strong>💎 Tingkat Keanggotaan: Platinum VIP</strong> • Anda berhak mendapatkan layanan VIP Full Handling end-to-end (penjemputan rumah, airport handling, penjemputan bandara tujuan, dan hotel check-in lengkap).
            </div>
          )}

          {/* Status Banner */}
          <div 
            className="rounded-3xl p-6 mb-8 text-white relative overflow-hidden shadow-md" 
            style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 100%)" }}
          >
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 90% 30%, white 0%, transparent 50%)" }} />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Tiket Aktif</div>
                <h2 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {trip?.title || "Tidak ada tiket perjalanan aktif"}
                </h2>
                <p className="text-white/80 text-xs mt-1.5 font-medium">
                  {trip?.description || "Hubungi admin untuk mendaftarkan perjalanan Anda."}
                </p>
              </div>
              {trip && (
                <div className="text-left md:text-right flex-shrink-0">
                  <div className="flex items-center gap-2 md:justify-end mb-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span 
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: overallColor }}
                      />
                      <span 
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ background: overallColor }}
                      />
                    </span>
                    <span className="font-bold text-sm" style={{ color: overallColor }}>
                      {statusLabelMap[overallStatus as TravelStatus]}
                    </span>
                  </div>
                  <div className="text-white/50 text-[10px]">Terupdate secara otomatis</div>
                </div>
              )}
            </div>
          </div>

          {trip ? (
            /* Main Grid: Map + Timeline */
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Map Panel (2 Columns) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl border border-border p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Peta Monitoring Lokasi
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
                  
                  {/* Indonesia Map dynamically loaded on client */}
                  <IndonesiaMap 
                    travelers={travelers} 
                    onStatusChange={handleReadOnlyClick} 
                  />
                </div>
              </div>

              {/* Timeline Panel (1 Column) */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-border">
                    <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Timeline Perjalanan ({userTier} Member)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fasilitas handling fisik yang disesuaikan dengan level membership Anda
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="relative">
                      {/* Vertical line connecting timeline steps */}
                      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border/70" />
                      
                      <div className="space-y-6">
                        {timeline.map((step: any) => {
                          const color = statusColorMap[step.status as TravelStatus] || "#9CA3AF";
                          const isActive = step.status === "in-progress";
                          const isDone = step.status === "done";
                          
                          return (
                            <div key={step.id} className="flex gap-4">
                              <div 
                                className="relative z-10 flex-shrink-0 cursor-pointer"
                                onClick={handleReadOnlyClick}
                                title="Diperbarui oleh tim lapangan"
                              >
                                <div 
                                  className={`w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all ${
                                    isActive ? "animate-pulse scale-105" : "hover:scale-102"
                                  }`} 
                                  style={{ background: color }}
                                >
                                  {isDone ? (
                                    <Check className="w-4 h-4 text-white stroke-[3]" />
                                  ) : isActive ? (
                                    <Navigation className="w-4 h-4 text-white fill-white/20" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              </div>
                              
                              <div 
                                className={`flex-1 rounded-2xl p-4 border transition-all ${
                                  isActive 
                                    ? "border-amber-200 bg-amber-50/15" 
                                    : "border-border bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-bold text-xs md:text-sm text-foreground leading-snug" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                      {step.label}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5 font-medium">
                                      <User className="w-3.5 h-3.5 text-muted-foreground/80" />
                                      <span>{step.officer}</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/75 mt-1">
                                      {step.time}
                                    </div>
                                  </div>
                                  
                                  <span 
                                    onClick={handleReadOnlyClick}
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex-shrink-0 cursor-pointer select-none" 
                                    style={{ background: color }}
                                  >
                                    {statusLabelMap[step.status as TravelStatus]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4.5 bg-secondary/30 border-t border-border flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#800000] flex-shrink-0" />
                    <span className="text-[10px] text-muted-foreground leading-relaxed">
                      Tim lapangan Ranata Tour memperbarui status secara berkala. Hubungi admin jika terdapat kendala.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-[#800000] font-black text-xl">
                ✈️
              </div>
              <h3 className="text-md font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Belum Ada Rencana Perjalanan
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Anda belum terdaftar dalam jadwal perjalanan aktif. Hubungi CS/Admin Ranata Tour untuk mendaftarkan tiket penerbangan dan akomodasi Anda agar dapat dilacak secara live.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
