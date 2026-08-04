"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, ChevronRight, Inbox } from "lucide-react";
import { memberApi, getToken } from "@/lib/api";
import { StatusPill } from "@/components/shared";
import { toast } from "sonner";

export default function TransactionHistoryPage() {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await memberApi.getTransactions();
      if (res.success && res.data) {
        setTransactions(res.data);
      } else {
        toast.error(res.message ?? "Gagal memuat riwayat transaksi.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
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
    fetchTransactions();
  }, [router]);

  // Filter transactions based on status & search term
  const filteredTransactions = transactions.filter(t => {
    const serviceName = t.service || "";
    const txNum = t.transaction_number || "";
    
    const matchesSearch = serviceName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          txNum.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back to Dashboard */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
        {/* Header and Controls */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Riwayat Transaksi
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Semua transaksi layanan Ranata Tour Anda
            </p>
          </div>

          {/* Search and Filter Actions */}
          <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-background transition-colors ${
                  showFilterDropdown || statusFilter !== "all"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border text-foreground bg-white"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter{statusFilter !== "all" && `: ${statusFilter === "pending" ? "Menunggu" : statusFilter === "verified" ? "Terverifikasi" : "Ditolak"}`}</span>
              </button>

              {/* Dropdown Menu */}
              {showFilterDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-lg z-20 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Status Transaksi
                    </div>
                    {[
                      { key: "all", label: "Semua Status" },
                      { key: "pending", label: "Menunggu (Pending)" },
                      { key: "verified", label: "Terverifikasi" },
                      { key: "rejected", label: "Ditolak" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setStatusFilter(opt.key as any);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-background transition-colors flex items-center justify-between ${
                          statusFilter === opt.key ? "font-bold text-primary bg-primary/5" : "text-foreground"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {statusFilter === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table / List View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-muted-foreground">Memuat riwayat transaksi...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="bg-background">
                <tr className="border-b border-border">
                  {["ID Transaksi", "Layanan", "Jumlah", "Tanggal", "Status", "Poin"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-background/40 transition-colors group"
                  >
                    <td className="px-6 py-4.5 text-xs font-mono text-muted-foreground">
                      {t.transaction_number || `TRX-${t.id}`}
                    </td>
                    <td className="px-6 py-4.5 text-xs font-semibold text-foreground">
                      {t.service}
                    </td>
                    <td className="px-6 py-4.5 text-xs font-bold text-foreground">
                      {t.formatted_amount || `Rp ${Number(t.amount).toLocaleString("id-ID")}`}
                    </td>
                    <td className="px-6 py-4.5 text-xs text-muted-foreground">
                      {t.date}
                    </td>
                    <td className="px-6 py-4.5">
                      <StatusPill status={t.status} />
                    </td>
                    <td
                      className="px-6 py-4.5 text-xs font-black animate-pulse-slow"
                      style={{ color: "#DAA520", fontFamily: "Montserrat, sans-serif" }}
                    >
                      +{t.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Empty State */
            <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">
                Tidak ada transaksi ditemukan
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Coba sesuaikan kata kunci pencarian atau bersihkan filter status untuk melihat transaksi Anda.
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 text-xs font-bold text-primary hover:underline"
                >
                  Reset Pencarian & Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
