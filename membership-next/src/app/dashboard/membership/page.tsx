"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, ArrowRight, Award, Shield, Sparkles, Loader2, ChevronRight
} from "lucide-react";
import { memberApi, getToken } from "@/lib/api";
import { TierBadge } from "@/components/shared";
import { toast } from "sonner";

export default function MembershipPurchasePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchProfileAndInvoices = async () => {
    try {
      setLoading(true);
      const [profileRes, invoicesRes] = await Promise.all([
        memberApi.getProfile(),
        memberApi.getInvoices()
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        toast.error("Gagal mengambil data profil.");
      }

      if (invoicesRes.success && invoicesRes.data) {
        setInvoices(invoicesRes.data);
      } else {
        toast.error("Gagal mengambil data tagihan.");
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
    fetchProfileAndInvoices();
  }, [router]);

  const pendingMembership = invoices.find(
    (inv: any) =>
      inv.service.includes("Membership") &&
      (inv.status === "pending-payment" || inv.status === "waiting-verification")
  );

  const getButtonState = (tierName: "Silver" | "Gold" | "Platinum") => {
    const currentTier = profile?.tier || "Bronze";

    // 1. Current Active Tier
    if (currentTier.toLowerCase() === tierName.toLowerCase()) {
      return {
        text: "Paket Anda Saat Ini",
        disabled: true,
        variant: "active",
        onClick: () => {},
      };
    }

    // 2. Already Covered by higher tier
    const tierHierarchy = ["bronze", "silver", "gold", "platinum"];
    const currentIdx = tierHierarchy.indexOf(currentTier.toLowerCase());
    const targetIdx = tierHierarchy.indexOf(tierName.toLowerCase());

    if (currentIdx > targetIdx) {
      return {
        text: "Benefit Sudah Tercakup",
        disabled: true,
        variant: "covered",
        onClick: () => {},
      };
    }

    // 3. Pending/Waiting verification membership invoice
    if (pendingMembership) {
      const isThisPending = pendingMembership.service.includes(tierName);
      if (isThisPending) {
        return {
          text: pendingMembership.status === "waiting-verification"
            ? "Menunggu Verifikasi (Lihat Detail)"
            : "Menunggu Pembayaran (Bayar Sekarang)",
          disabled: false,
          variant: "pending-this",
          onClick: () => router.push("/dashboard/tagihan"),
        };
      } else {
        let pendingTierName = "Lain";
        if (pendingMembership.service.includes("Silver")) pendingTierName = "Silver";
        else if (pendingMembership.service.includes("Gold")) pendingTierName = "Gold";
        else if (pendingMembership.service.includes("Platinum")) pendingTierName = "Platinum";

        return {
          text: `Selesaikan Tagihan ${pendingTierName}`,
          disabled: false,
          variant: "pending-other",
          onClick: () => router.push("/dashboard/tagihan"),
        };
      }
    }

    // 4. Default purchase/upgrade
    return {
      text: currentTier === "Bronze" ? `Beli Paket ${tierName}` : `Upgrade ke ${tierName}`,
      disabled: false,
      variant: "purchase",
      onClick: () => handlePurchase(tierName),
    };
  };

  const getButtonClass = (variant: string, defaultClass: string) => {
    switch (variant) {
      case "active":
        return "w-full py-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed text-center";
      case "covered":
        return "w-full py-3 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed text-center";
      case "pending-this":
        return "w-full py-3 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center justify-center gap-2 animate-pulse";
      case "pending-other":
        return "w-full py-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center gap-2";
      case "purchase":
      default:
        return `w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${defaultClass}`;
    }
  };

  const handlePurchase = async (tier: "Silver" | "Gold" | "Platinum") => {
    // Validate profile fields strictly on checkout/purchase
    if (!profile?.birthdate || profile.birthdate === "Belum diatur" || 
        !profile?.city || profile.city === "Belum diatur" || 
        !profile?.address || profile.address === "Belum diatur") {
      toast.warning("Silakan lengkapi Tanggal Lahir, Kota Domisili, dan Alamat Domisili Anda terlebih dahulu di profil sebelum melakukan pemesanan.");
      router.push("/dashboard/profil");
      return;
    }

    try {
      setPurchasing(tier);
      const res = await memberApi.upgrade(tier);
      if (res.success) {
        toast.success(`Berhasil memilih Paket ${tier}!`, {
          description: "Silakan unggah bukti transfer pada halaman tagihan untuk melakukan aktivasi.",
          duration: 6000,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("invoices-updated"));
        }
        router.push("/dashboard/tagihan");
      } else {
        toast.error(res.message ?? `Gagal melakukan pemesanan paket ${tier}.`);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setPurchasing(null);
    }
  };

  const currentTier = profile?.tier || "Bronze";

  const tiers = [
    {
      name: "Silver" as const,
      price: "Rp 2.500.000",
      period: "/tahun",
      welcome: "500 poin",
      tagline: "Layanan dasar & transportasi bandara gratis.",
      features: [
        "Sewa Transportasi ke Bandara",
        "Layanan 24/7 via Chat",
        "Poin setiap transaksi",
        "Akses dashboard member",
      ],
      color: "from-gray-300 to-gray-500",
      accent: "#800000",
      bgBtn: "bg-[#800000]/10 text-[#800000] hover:bg-[#800000]/20",
    },
    {
      name: "Gold" as const,
      price: "Rp 5.000.000",
      period: "/tahun",
      welcome: "1.200 poin",
      tagline: "Handling penuh bandara & diskon 10% layanan.",
      features: [
        "Semua benefit Silver",
        "Handling di Bandara (check-in & boarding)",
        "Jemput di bandara tujuan",
        "Diskon 10% semua layanan",
        "Multiplier poin 1.5×",
      ],
      color: "from-amber-400 to-yellow-600",
      accent: "#B8860B",
      bgBtn: "bg-[#B8860B]/10 text-[#B8860B] hover:bg-[#B8860B]/20",
    },
    {
      name: "Platinum" as const,
      price: "Rp 10.000.000",
      period: "/tahun",
      welcome: "3.000 poin",
      tagline: "Layanan full-handling end-to-end + personal assistant.",
      features: [
        "Semua benefit Gold",
        "Penjemputan dari rumah",
        "Handling penuh bandara + hotel",
        "Check-in hotel diurus tim",
        "Personal consultant khusus",
        "Diskon 15% semua layanan",
        "Akses lounge bandara premium",
      ],
      color: "from-red-600 to-rose-950",
      accent: "#800000",
      bgBtn: "bg-[#800000] text-white hover:bg-[#800000]/90",
      popular: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat paket membership...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          RANATA PREMIUM SERVICE
        </div>
        <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Pilih Paket & Upgrade Membership
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-2">
          Nikmati kemudahan penjemputan dari pintu rumah Anda, check-in hotel yang diurus oleh tim kami, hingga akses lounge bandara VIP.
        </p>
      </div>

      {/* Current membership info */}
      <div className="bg-white border border-border rounded-3xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-[#800000] font-black text-lg">
            🛡️
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status Keanggotaan Anda Saat Ini</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-sm text-foreground">{profile?.name}</span>
              <TierBadge tier={currentTier} size="md" />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Akumulasi Poin</div>
          <div className="font-black text-lg text-amber-500 mt-0.5">{profile?.points.toLocaleString("id-ID")} Poin</div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((t) => {
          return (
            <div 
              key={t.name}
              className={`bg-white rounded-3xl border-2 flex flex-col p-6 relative transition-all duration-300 hover:shadow-xl ${
                t.popular ? "border-[#800000] shadow-md scale-102" : "border-border hover:border-primary/20"
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#800000] text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  TERPOPULER
                </div>
              )}

              {/* Tier Name */}
              <div className="mb-4">
                <TierBadge tier={t.name} size="md" />
                <p className="text-xs text-muted-foreground mt-2">{t.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {t.price}
                </span>
                <span className="text-muted-foreground text-xs">{t.period}</span>
                <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-2.5 flex items-center gap-1.5 w-fit">
                  🎁 Welcome Bonus {t.welcome}
                </div>
              </div>

              {/* Features List */}
              <div className="border-t border-border pt-4 flex-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Benefit Anggota:
                </div>
                <ul className="space-y-2.5 mb-8">
                  {t.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/80 leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Purchase button */}
              <div className="mt-auto pt-4 border-t border-border/50">
                {(() => {
                  const btnState = getButtonState(t.name);
                  const btnClass = getButtonClass(btnState.variant, t.bgBtn);

                  return (
                    <button
                      onClick={btnState.onClick}
                      disabled={btnState.disabled || purchasing !== null}
                      className={btnClass}
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {purchasing === t.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          {btnState.text}
                          {btnState.variant === "purchase" && <ArrowRight className="w-3.5 h-3.5" />}
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
