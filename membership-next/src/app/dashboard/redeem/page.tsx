"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Star, ChevronRight, Inbox, Shield, Check, 
  Hotel, Car, Plane, Globe, Coffee, FileText, Building, Gift 
} from "lucide-react";
import { getMemberProfile } from "@/lib/data-fetchers";
import { TierBadge } from "@/components/shared";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { memberApi, getToken } from "@/lib/api";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Hotel: Hotel,
  Car: Car,
  Plane: Plane,
  Globe: Globe,
  Coffee: Coffee,
  FileText: FileText,
  Building: Building,
  Star: Star
};

export default function RedeemPointsPage() {
  const router = useRouter();
  
  // State for profile & rewards API
  const [profile, setProfile] = useState<any>(null);
  const [rewardsList, setRewardsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemed, setRedeemed] = useState<number[]>([]);
  const [filter, setFilter] = useState("Semua");
  
  // Confirmation Modal State
  const [confirmReward, setConfirmReward] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, rewardsRes] = await Promise.all([
        memberApi.getProfile(),
        memberApi.getRewards(),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      }
      if (rewardsRes.success && rewardsRes.data) {
        setRewardsList(rewardsRes.data);
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server.");
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
    loadData();
  }, [router]);

  const pts = profile ? profile.points : 0;

  const categories = ["Semua", "Hotel", "Transport", "Tiket", "Wisata", "Kuliner", "Dokumen", "Umroh", "Fasilitas"];
  
  // Filter rewards
  const filteredRewards = filter === "Semua" 
    ? rewardsList 
    : rewardsList.filter((r: any) => r.category === filter);

  const handleRedeemClick = (reward: any) => {
    // Check profile completion before redeeming rewards/claiming benefits
    if (!profile?.birthdate || profile.birthdate === "Belum diatur" || 
        !profile?.city || profile.city === "Belum diatur" || 
        !profile?.address || profile.address === "Belum diatur") {
      toast.warning("Lengkapi Tanggal Lahir, Kota Domisili, dan Alamat Anda terlebih dahulu di profil untuk klaim benefit.");
      router.push("/dashboard/profil");
      return;
    }
    setConfirmReward(reward);
  };

  const confirmRedeem = async () => {
    if (!confirmReward) return;
    
    try {
      setSubmitting(true);
      const res = await memberApi.redeemReward(confirmReward.id);
      
      if (res.success) {
        setRedeemed(prev => [...prev, confirmReward.id]);
        
        // Trigger toast notice
        toast.success(`Berhasil menukar "${confirmReward.name}"!`, {
          description: res.message || "Periksa email Anda untuk detail voucher.",
          duration: 5000,
        });

        // Reload profile to update points
        loadData();
      } else {
        toast.error(res.message ?? "Gagal menukarkan poin.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi saat menukar reward.");
    } finally {
      setSubmitting(false);
      setConfirmReward(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* Banner Poin */}
      <div 
        className="rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white relative overflow-hidden shadow-md" 
        style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 60%, #2a0000 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(218,165,32,0.4) 0%, transparent 60%)" }} />
        
        <div className="relative z-10">
          <div className="text-white/70 text-xs md:text-sm font-semibold mb-1">Poin Tersedia</div>
          <div className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: "Montserrat, sans-serif", color: "#DAA520" }}>
            {pts.toLocaleString("id-ID")}
          </div>
          <div className="text-white/60 text-xs mt-1.5 font-medium">
            Berlaku hingga {profile?.pointsExpiry || "31 Desember 2026"}
          </div>
        </div>

        <div className="relative z-10 md:text-right flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
          <div>
            <div className="text-white/70 text-xs mb-1.5 md:block hidden">Status Tier</div>
            <TierBadge tier={profile?.tier || "Bronze"} size="md" />
          </div>
          <div className="text-white/60 text-xs font-semibold">
            Bonus: 2× Poin tiap transaksi
          </div>
        </div>
      </div>

      {/* Filter Kategori */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setFilter(c)} 
            className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
              filter === c 
                ? "text-white border-transparent shadow-xs" 
                : "text-muted-foreground border-border bg-white hover:border-primary/30 hover:text-foreground"
            }`} 
            style={filter === c ? { background: "#800000" } : {}}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid Rewards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat daftar benefit reward...</p>
        </div>
      ) : filteredRewards.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRewards.map((r: any) => {
            const isRedeemed = redeemed.includes(r.id);
            const canAfford = pts >= r.points;
            
            // Resolve icon mapping
            const IconComponent = typeof r.icon === "string" ? (iconMap[r.icon] || Gift) : (r.icon || Gift);

            return (
              <div 
                key={r.id} 
                className="bg-white rounded-3xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
              >
                {/* Image Section using ImageWithFallback */}
                <div className="relative h-40 bg-secondary/30 flex items-center justify-center overflow-hidden border-b border-border flex-shrink-0">
                  <ImageWithFallback 
                    src={`/images/rewards/reward-${r.id}.png`} 
                    alt={r.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 z-10">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-muted-foreground border border-border shadow-xs">
                      {r.category}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/5 border border-primary/10 mt-0.5 flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {r.name}
                    </h4>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-grow line-clamp-3">
                    {r.desc}
                  </p>

                  <div className="flex items-center gap-1.5 mb-4 mt-auto">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-black text-sm text-amber-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {r.points.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-muted-foreground">poin</span>
                  </div>

                  {/* Actions */}
                  <button 
                    onClick={() => canAfford && !isRedeemed && handleRedeemClick(r)} 
                    disabled={!canAfford || isRedeemed} 
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isRedeemed 
                        ? "bg-green-50 border border-green-200 text-green-700 cursor-default" 
                        : canAfford 
                          ? "text-white hover:opacity-90 active:scale-98" 
                          : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                    }`} 
                    style={!isRedeemed && canAfford ? { background: "#800000" } : {}}
                  >
                    {isRedeemed ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Berhasil Ditukar
                      </span>
                    ) : canAfford ? (
                      "Tukarkan Sekarang"
                    ) : (
                      "Poin Tidak Cukup"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 px-6 bg-white rounded-3xl border border-border flex flex-col items-center justify-center text-center max-w-7xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-sm text-foreground mb-1">
            Kategori reward kosong
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
            Saat ini belum ada benefit reward dalam kategori "{filter}". Coba pilih kategori lainnya.
          </p>
          <button
            onClick={() => setFilter("Semua")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Lihat Semua Kategori
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            onClick={() => setConfirmReward(null)}
          />
          <div className="bg-white rounded-3xl border border-border w-full max-w-md p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-spin-slow" />
              </div>
              <h3 className="font-bold text-base text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Konfirmasi Penukaran
              </h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Apakah Anda yakin ingin menukarkan <strong className="text-foreground">{confirmReward.points.toLocaleString("id-ID")} poin</strong> untuk reward <strong className="text-foreground">"{confirmReward.name}"</strong>?
            </p>
            
            <div className="bg-secondary/40 rounded-2xl p-3 mb-5 border border-border flex items-center gap-3">
              <ImageWithFallback 
                src={`/images/rewards/reward-${confirmReward.id}.png`} 
                alt={confirmReward.name} 
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div>
                <h4 className="text-xs font-bold text-foreground leading-tight">{confirmReward.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{confirmReward.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => !submitting && setConfirmReward(null)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmRedeem}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "#800000" }}
              >
                {submitting ? "Menukar..." : "Ya, Tukarkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
