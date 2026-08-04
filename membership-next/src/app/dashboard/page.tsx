"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, CreditCard, Navigation, Gift, History, User,
  Hash, AlertCircle, Plane, Award
} from "lucide-react";
import { TierBadge, StatusPill } from "@/components/shared";
import { getMemberProfile } from "@/lib/data-fetchers";
import { memberApi, getToken, removeToken, setStoredUser } from "@/lib/api";
import { toast } from "sonner";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [profileRes, invoicesRes, txsRes] = await Promise.all([
          memberApi.getProfile(),
          memberApi.getInvoices(),
          memberApi.getTransactions(),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          setStoredUser(profileRes.data);
          window.dispatchEvent(new Event("profile-updated"));
        } else {
          // Token expired or invalid
          removeToken();
          router.push("/auth");
          return;
        }

        if (invoicesRes.success && invoicesRes.data) {
          setInvoices(invoicesRes.data);
        }
        if (txsRes.success && txsRes.data) {
          setRecentTxs(txsRes.data.slice(0, 3));
        }
      } catch (err) {
        toast.error("Gagal memuat data dari server.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  // Fallback to mock profile during SSR or loading
  const currentProfile = profile || {
    member_id: "RT-...",
    name: "Loading...",
    tier: "Bronze",
    points: 0,
    joined_date: "...",
    total_services: 0,
    status: "Active"
  };

  const pendingInvoice = invoices.find((i: any) => i.status === "pending-payment");
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending-payment").length;

  const quickActions = [
    { icon: MessageCircle, label: "Request Layanan", path: "/dashboard/layanan" },
    { icon: Award, label: "Beli Membership", path: "/dashboard/membership" },
    { icon: CreditCard, label: "Tagihan & Bayar", path: "/dashboard/tagihan", badge: pendingInvoices },
    { icon: Navigation, label: "Status Perjalanan", path: "/dashboard/perjalanan" },
    { icon: Gift, label: "Tukar Poin", path: "/dashboard/redeem" },
    { icon: History, label: "Riwayat", path: "/dashboard/riwayat" },
    { icon: User, label: "Profil Saya", path: "/dashboard/profil" },
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Membership Card */}
      <div className="relative rounded-3xl overflow-hidden p-8 mb-8 text-white" style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 60%, #2a0000 100%)", minHeight: 180 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(218,165,32,0.4) 0%, transparent 60%)" }} />
        <div className="relative grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <TierBadge tier={currentProfile.tier} size="md" />
              <span className="text-white/50 text-xs">Member {currentProfile.status === "Active" ? "Aktif" : "Non-Aktif"}</span>
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{currentProfile.name}</h2>
            <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
              <Hash className="w-3.5 h-3.5" />
              <span>{currentProfile.member_id}</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-white/60 text-xs mb-1">Total Poin</div>
                <div className="text-3xl font-black" style={{ fontFamily: "Montserrat, sans-serif", color: "#DAA520" }}>
                  {currentProfile.points.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <div className="text-white/60 text-xs mb-1">Bergabung</div>
                <div className="text-sm font-semibold">{currentProfile.joined_date || currentProfile.joinedDate}</div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <div className="text-white/60 text-xs mb-1">Transaksi</div>
                <div className="text-sm font-semibold">{currentProfile.total_services ?? currentProfile.totalServices} Layanan</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="text-right">
              <div className="text-white/60 text-xs mb-1">Poin kadaluarsa</div>
              <div className="text-sm font-semibold text-yellow-300">{currentProfile.pointsExpiry || "31 Des 2026"}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button onClick={() => router.push("/dashboard/perjalanan")} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105" style={{ background: "#DAA520", color: "#2a1800", fontFamily: "Montserrat, sans-serif" }}>
                <Navigation className="w-3.5 h-3.5" /> Lihat Status Perjalanan
              </button>
              {currentProfile.tier.toLowerCase() === "bronze" ? (
                <button onClick={() => router.push("/dashboard/membership")} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 bg-white text-[#800000] hover:bg-white/90" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  ⚡ Pilih Paket Membership
                </button>
              ) : (
                <button onClick={() => router.push("/dashboard/membership")} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 bg-white/15 hover:bg-white/25 text-white border border-white/20" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  ⚡ Upgrade Membership
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {quickActions.map(a => (
          <button key={a.label} onClick={() => router.push(a.path)} className="relative bg-white rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all group text-center">
            {a.badge && a.badge > 0 ? (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center bg-red-500">
                {a.badge}
              </span>
            ) : null}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform" style={{ background: "rgba(128,0,0,0.08)" }}>
              <a.icon className="w-5 h-5" style={{ color: "#800000" }} />
            </div>
            <div className="font-bold text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* Invoice Alert + Recent */}
      <div className="grid md:grid-cols-2 gap-6">
        {pendingInvoice ? (
          <div className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-bold text-sm text-yellow-800" style={{ fontFamily: "Montserrat, sans-serif" }}>Tagihan Menunggu Pembayaran</h3>
            </div>
            <div className="bg-white rounded-xl p-4 border border-yellow-200 mb-3">
              <div className="text-xs font-semibold mb-1">{pendingInvoice.service}</div>
              <div className="text-xl font-black" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>{pendingInvoice.amount}</div>
              <div className="text-xs text-muted-foreground mt-1">Invoice #{pendingInvoice.id} • Dikirim {pendingInvoice.date}</div>
            </div>
            <button onClick={() => router.push("/dashboard/tagihan")} className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ background: "#800000" }}>
              Bayar Sekarang
            </button>
          </div>
        ) : (
          <div className="bg-green-50/50 border border-green-200 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5 text-green-600 rotate-180" />
            </div>
            <h3 className="font-bold text-sm text-green-850 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Semua Tagihan Lunas</h3>
            <p className="text-xs text-muted-foreground max-w-xs">Tidak ada tagihan tertunggak saat ini. Terima kasih telah melakukan pembayaran tepat waktu!</p>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Transaksi Terbaru</h3>
            <button onClick={() => router.push("/dashboard/riwayat")} className="text-xs font-semibold hover:underline" style={{ color: "#800000" }}>Lihat Semua</button>
          </div>
          <div className="divide-y divide-border">
            {recentTxs.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-background transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(128,0,0,0.08)" }}>
                  <Plane className="w-4 h-4" style={{ color: "#800000" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{t.service}</div>
                  <div className="text-[10px] text-muted-foreground">{t.date}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold">{t.amount}</div>
                  <StatusPill status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
