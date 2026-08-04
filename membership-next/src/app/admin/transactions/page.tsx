"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, CheckCircle2, XCircle, AlertCircle, Eye, Inbox, FileText, Check, X 
} from "lucide-react";
import { adminApi, getToken } from "@/lib/api";
import { toast } from "sonner";
import type { TxStatus } from "@/types";

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [selectedProof, setSelectedProof] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = async (statusVal: string) => {
    try {
      setLoading(true);
      const res = await adminApi.getTransactions(statusVal);
      if (res.success && res.data) {
        setTxs(res.data);
      } else {
        toast.error(res.message ?? "Gagal memuat transaksi.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchTransactions(activeTab);
  }, [activeTab]);

  const handleVerify = async (id: number, newStatus: "verified" | "rejected") => {
    try {
      setSubmitting(true);
      const res = await adminApi.verifyTransaction(id, newStatus);
      if (res.success) {
        toast.success(res.message ?? "Status transaksi berhasil diperbarui!");
        // Refresh transaction list
        fetchTransactions(activeTab);
      } else {
        toast.error(res.message ?? "Gagal memproses verifikasi.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = txs.filter((t: any) => t.status === "pending").length;

  const statusMap = {
    pending: { label: "Menunggu", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
    verified: { label: "Disetujui", cls: "bg-green-50 text-green-700 border-green-200" },
    rejected: { label: "Ditolak", cls: "bg-red-50 text-red-600 border-red-200" }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Verifikasi Pembayaran
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Validasi unggahan bukti transfer dari member dan setujui penambahan poin loyalty secara manual
          </p>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>{pendingCount} Verifikasi Tertunda</span>
          </div>
        )}
      </div>

      {/* Tabs and Navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        {[
          { key: "all", label: "Semua Transaksi" },
          { key: "pending", label: "Perlu Tindakan", badge: pendingCount },
          { key: "verified", label: "Disetujui" },
          { key: "rejected", label: "Ditolak" }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === t.key 
                ? "border-[#800000] text-[#800000]" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge > 0 ? (
              <span className="text-[9px] font-black bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/25 border-b border-border">
                {["ID Transaksi", "Member", "Layanan", "Jumlah Transfer", "Reward Poin", "Tanggal", "Bukti", "Status", "Tindakan"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                    <div className="w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <div className="text-xs font-bold">Memuat daftar transaksi...</div>
                  </td>
                </tr>
              ) : txs.length > 0 ? (
                txs.map((t: any) => {
                  const isPending = t.status === "pending";
                  const config = statusMap[t.status as TxStatus] || statusMap.pending;

                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-secondary/15 transition-colors ${
                        isPending ? "bg-amber-50/10" : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-semibold text-muted-foreground">
                        {t.transaction_number || `TRX-${t.id}`}
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground">{t.member}</td>
                      <td className="px-5 py-4 text-muted-foreground max-w-44 truncate" title={t.service}>{t.service}</td>
                      <td className="px-5 py-4 font-extrabold text-foreground">{t.formatted_amount || t.amount}</td>
                      <td className="px-5 py-4 font-black" style={{ color: "#DAA520" }}>
                        +{t.points} Pts
                      </td>
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{t.date}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedProof(t)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[10px] font-bold text-[#800000] hover:bg-secondary/40 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat Bukti
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${config.cls}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerify(t.id, "verified")}
                              disabled={submitting}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              Terima
                            </button>
                            <button
                              onClick={() => handleVerify(t.id, "rejected")}
                              disabled={submitting}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                            >
                              <X className="w-3 h-3 stroke-[3]" />
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-muted-foreground">
                    <Inbox className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                    <div className="text-xs font-bold">Tidak ada transaksi ditemukan</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Semua data verifikasi telah diproses</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Preview Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/20">
              <div>
                <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Bukti Pembayaran
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selectedProof.id}</p>
              </div>
              <button 
                onClick={() => setSelectedProof(null)} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-secondary/45 rounded-2xl p-4 border border-border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Pengirim:</span>
                  <span className="font-bold text-foreground">{selectedProof.member}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Layanan:</span>
                  <span className="font-bold text-foreground text-right max-w-[200px] truncate">{selectedProof.service}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Nominal Transfer:</span>
                  <span className="font-extrabold text-[#800000]">{selectedProof.formatted_amount || selectedProof.amount}</span>
                </div>
              </div>

              {/* Render Bukti Transfer Image */}
              {selectedProof.proof_url ? (
                <div className="border border-border rounded-2xl overflow-hidden bg-black flex items-center justify-center h-72 relative">
                  <img 
                    src={selectedProof.proof_url} 
                    alt="Bukti Pembayaran" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden bg-secondary/15 flex flex-col items-center justify-center p-8 text-center h-44 relative">
                  <FileText className="w-10 h-10 text-muted-foreground/60 mb-2" />
                  <div className="font-mono text-xs font-bold text-foreground">Tidak ada gambar bukti terlampir</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Simulasi transfer atau bukti belum diunggah</div>
                </div>
              )}
            </div>

            <div className="p-4 bg-secondary/35 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-secondary/50 transition-colors"
                disabled={submitting}
              >
                Tutup
              </button>
              {selectedProof.status === "pending" && (
                <>
                  <button
                    onClick={async () => { await handleVerify(selectedProof.id, "rejected"); setSelectedProof(null); }}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={async () => { await handleVerify(selectedProof.id, "verified"); setSelectedProof(null); }}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                  >
                    Terima & Tambah Poin
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
