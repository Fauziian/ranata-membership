"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, MapPin, AlertCircle, TrendingUp, ChevronRight, 
  RefreshCw, CheckCircle, XCircle, ArrowUpRight
} from "lucide-react";
import { adminApi, getToken } from "@/lib/api";
import { getTravelersList } from "@/lib/data-fetchers";
import type { TxStatus } from "@/types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // Dynamic states
  const [statsData, setStatsData] = useState<any>(null);
  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStats();
      if (res.success && res.data) {
        setStatsData(res.data);
      } else {
        toast.error(res.message ?? "Gagal memuat statistik admin.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi atau Anda tidak memiliki akses admin.");
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
    fetchDashboardStats();
    setTravelers(getTravelersList());
  }, [router]);

  const handleRefresh = () => {
    fetchDashboardStats();
    setTravelers(getTravelersList());
  };

  // Dynamic calculations from statsData API
  const totalMembersCount = statsData?.total_members ?? 0;
  const pendingTxCount = statsData?.pending_verify ?? 0;
  const activeTravelersCount = 4; // Mocked active travelers
  const totalPoints = statsData?.total_points ?? 0;

  const stats = [
    { 
      label: "Total Member", 
      value: totalMembersCount, 
      change: "+12 bulan ini", 
      icon: Users, 
      color: "#800000",
      path: "/admin/members"
    },
    { 
      label: "Perjalanan Aktif", 
      value: activeTravelersCount, 
      change: "2 menunggu jemput", 
      icon: MapPin, 
      color: "#F59E0B",
      path: "/admin/map"
    },
    { 
      label: "Verifikasi Tertunda", 
      value: pendingTxCount, 
      change: pendingTxCount > 0 ? "Perlu tindakan segera" : "Semua bersih", 
      icon: AlertCircle, 
      color: "#EF4444",
      badge: pendingTxCount > 0,
      path: "/admin/transactions"
    },
    { 
      label: "Total Poin Member", 
      value: totalPoints.toLocaleString("id-ID"), 
      change: "Akumulasi seluruh member", 
      icon: TrendingUp, 
      color: "#22C55E",
      path: "/admin/members"
    },
  ];

  // Chart data
  const chartData = [
    { month: "Jan", transaksi: 120, pendapatan: 180 },
    { month: "Feb", transaksi: 150, pendapatan: 220 },
    { month: "Mar", transaksi: 180, pendapatan: 290 },
    { month: "Apr", transaksi: 220, pendapatan: 340 },
    { month: "Mei", transaksi: 310, pendapatan: 420 },
    { month: "Jun", transaksi: 280, pendapatan: 390 },
    { month: "Jul", transaksi: 380, pendapatan: 485 },
  ];

  const statusMap: Record<TxStatus, { label: string; cls: string }> = {
    pending: { label: "Menunggu", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
    verified: { label: "Disetujui", cls: "bg-green-50 text-green-700 border-green-200" },
    rejected: { label: "Ditolak", cls: "bg-red-50 text-red-600 border-red-200" }
  };

  if (loading && !statsData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat dashboard admin...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 
            className="text-2xl font-black text-foreground" 
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Beranda Admin
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Dashboard Operasional & Pemantauan Real-time Ranata Tour
          </p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-white hover:bg-secondary/40 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx} 
              onClick={() => router.push(s.path)}
              className="bg-white rounded-3xl p-6 border border-border hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" 
                style={{ background: `${s.color}15` }}
              >
                <Icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <div 
                className="text-2xl md:text-3xl font-black mb-1.5 text-foreground tracking-tight" 
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {s.value}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                {s.badge && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                {s.change}
              </div>
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Analisis Tren Pendapatan & Transaksi
            </h3>
            <p className="text-[10px] text-muted-foreground">Grafik akumulasi bulanan tahun 2026 (Juta Rp)</p>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#800000" }} />
              <span>Pendapatan (Juta)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
              <span>Total Transaksi</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#800000" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#800000" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorTransaksi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" tickLine={false} style={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tickLine={false} style={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(255,255,255,0.95)", 
                  borderColor: "#E5E7EB", 
                  borderRadius: 16, 
                  fontSize: 11,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }} 
              />
              <Area type="monotone" dataKey="pendapatan" stroke="#800000" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPendapatan)" />
              <Area type="monotone" dataKey="transaksi" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorTransaksi)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two columns: Pending transactions & travelers */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Verification tasks */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Verifikasi Pembayaran Terbaru
              </h3>
              <p className="text-[10px] text-muted-foreground">Transaksi menunggu persetujuan admin</p>
            </div>
            <button 
              onClick={() => router.push("/admin/transactions")} 
              className="text-xs font-semibold hover:underline" 
              style={{ color: "#800000" }}
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Member", "Layanan", "Jumlah", "Reward Poin", "Status"].map(h => (
                    <th key={h} className="pb-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {(statsData?.recent_txs && statsData.recent_txs.length > 0) ? (
                  statsData.recent_txs.slice(0, 4).map((t: any) => {
                    const statusConfig = statusMap[t.status as TxStatus] || statusMap.pending;
                    return (
                      <tr 
                        key={t.id} 
                        className="hover:bg-secondary/15 transition-colors cursor-pointer"
                        onClick={() => router.push("/admin/transactions")}
                      >
                        <td className="py-3.5 font-semibold text-foreground">{t.member}</td>
                        <td className="py-3.5 text-muted-foreground">{t.service}</td>
                        <td className="py-3.5 font-bold text-foreground">{t.formatted_amount || t.amount}</td>
                        <td className="py-3.5 font-bold text-amber-600">+{t.points}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusConfig.cls}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">
                      Tidak ada transaksi menunggu verifikasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Travelers Live Status */}
        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Status Perjalanan Live
            </h3>
            <p className="text-[10px] text-muted-foreground">Pelanggan aktif dalam destinasi tour</p>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-64 pr-1">
            {travelers.length > 0 ? (
              travelers.map((t: any) => {
                const color = t.status === "waiting" ? "#EF4444" : t.status === "in-progress" ? "#F59E0B" : "#22C55E";
                const label = t.status === "waiting" ? "Menunggu" : t.status === "in-progress" ? "In-Progress" : "Selesai";
                return (
                  <div 
                    key={t.id} 
                    onClick={() => router.push("/admin/map")}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/15 border border-transparent hover:border-border transition-all cursor-pointer"
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" 
                      style={{ backgroundColor: color }} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.location}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Tidak ada traveler aktif.
              </div>
            )}
          </div>

          <button 
            onClick={() => router.push("/admin/map")}
            className="w-full mt-6 py-3 rounded-2xl text-xs font-bold text-white text-center hover:opacity-90 active:scale-95 transition-all shadow-sm"
            style={{ background: "#800000" }}
          >
            Buka Peta Monitoring
          </button>
        </div>
      </div>
    </div>
  );
}
