"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, Clock, CheckCircle, AlertCircle, X, ChevronRight, Inbox 
} from "lucide-react";
import { memberApi, getToken, setStoredUser } from "@/lib/api";
import { toast } from "sonner";

type InvStatus = "pending-payment" | "waiting-verification" | "verified" | "lunas" | "rejected";

declare global {
  interface Window {
    snap: any;
  }
}

export default function InvoicesPage() {
  const router = useRouter();
  
  // Local state for API invoices
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Payment modal visibility: "pay" | null
  const [payStep, setPayStep] = useState<"pay" | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // Dynamic Midtrans configurations
  const [midtransClientKey, setMidtransClientKey] = useState<string>("");
  const [isProductionMode, setIsProductionMode] = useState<boolean>(false);

  // Countdown timer for 24 hours
  const [timeLeft, setTimeLeft] = useState<string>("24:00:00");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await memberApi.getInvoices();
      if (res.success && res.data) {
        setInvoices(res.data);
        if (res.midtrans_client_key) {
          setMidtransClientKey(res.midtrans_client_key);
        }
        if (res.midtrans_is_production !== undefined) {
          setIsProductionMode(res.midtrans_is_production);
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("invoices-updated"));
        }
      } else {
        toast.error(res.message ?? "Gagal memuat daftar tagihan.");
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
    fetchInvoices();
  }, [router]);

  useEffect(() => {
    const rejectedInvoices = invoices.filter((inv) => inv.status === "rejected");
    if (rejectedInvoices.length === 0) return;

    const now = new Date().getTime();
    let minDelay = 30000;

    rejectedInvoices.forEach((inv) => {
      const updatedAtTime = new Date(inv.updated_at).getTime();
      const timeElapsed = now - updatedAtTime;
      const timeLeftForPrune = 30000 - timeElapsed;
      if (timeLeftForPrune > 0 && timeLeftForPrune < minDelay) {
        minDelay = timeLeftForPrune;
      }
    });

    const timer = setTimeout(() => {
      fetchInvoices();
    }, Math.max(minDelay, 1000));

    return () => clearTimeout(timer);
  }, [invoices]);

  useEffect(() => {
    if (!midtransClientKey) return;

    const midtransScriptUrl = isProductionMode
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    // Avoid duplicating scripts
    const existingScript = document.querySelector(`script[src="${midtransScriptUrl}"]`);
    if (!existingScript) {
      // Clean up previous scripts if keys or mode changed
      const oldScripts = document.querySelectorAll('script[src*="snap.js"]');
      oldScripts.forEach((s) => s.remove());

      const script = document.createElement("script");
      script.src = midtransScriptUrl;
      script.setAttribute("data-client-key", midtransClientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [midtransClientKey, isProductionMode]);

  const selectedInv = invoices.find((i: any) => i.id === selectedId);

  useEffect(() => {
    if (!selectedInv || !payStep) return;

    const updateTimer = () => {
      let dateStr = selectedInv.created_at;
      if (dateStr && typeof dateStr === "string") {
        dateStr = dateStr.replace(" ", "T");
      }
      const createdAt = new Date(dateStr);
      const expireTime = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const now = new Date();
      const diff = expireTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired / Hangus");
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [selectedInv, payStep]);



  const handleOpenMidtrans = (snapToken: string) => {
    if (!snapToken) {
      toast.error("Token transaksi Midtrans tidak ditemukan. Silakan hubungi admin.");
      return;
    }

    if (typeof window !== "undefined" && window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: function (result: any) {
          toast.success("Pembayaran berhasil!");
          fetchInvoices();
          resetModal();
        },
        onPending: function (result: any) {
          toast.info("Menunggu pembayaran Anda.");
          fetchInvoices();
          resetModal();
        },
        onError: function (result: any) {
          toast.error("Pembayaran gagal.");
          fetchInvoices();
        },
        onClose: function () {
          toast.warning("Anda menutup pop-up pembayaran.");
        },
      });
    } else {
      toast.error("Menginisialisasi modul pembayaran Midtrans. Silakan coba sesaat lagi.");
    }
  };

  const handleCancelInvoice = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan tagihan membership ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      setCancelling(id);
      const res = await memberApi.cancelInvoice(id);
      if (res.success) {
        toast.success("Tagihan berhasil dibatalkan.");
        fetchInvoices();
        resetModal();
      } else {
        toast.error(res.message ?? "Gagal membatalkan tagihan.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setCancelling(null);
    }
  };

  const resetModal = () => {
    setPayStep(null);
    setSelectedId(null);
  };

  const invStatusMap = {
    "pending-payment": { label: "Belum Dibayar", cls: "bg-red-50 border border-red-200 text-red-700" },
    "waiting-verification": { label: "Menunggu Verifikasi", cls: "bg-yellow-50 border border-yellow-200 text-yellow-800" },
    "verified": { label: "Terverifikasi", cls: "bg-green-50 border border-green-200 text-green-700" },
    "lunas": { label: "Lunas / Terverifikasi", cls: "bg-green-50 border border-green-200 text-green-700" },
    "rejected": { label: "Ditolak", cls: "bg-gray-50 border border-gray-200 text-gray-500" },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Tagihan & Pembayaran
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          Daftar invoice resmi dari admin yang memerlukan pembayaran Anda
        </p>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Memuat tagihan...</p>
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-5">
          {invoices.map((inv: any) => {
            const statusConfig = invStatusMap[inv.status as InvStatus] || invStatusMap["pending-payment"];
            
            return (
              <div 
                key={inv.id} 
                className="bg-white rounded-3xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-xs font-mono font-semibold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                        {inv.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {inv.service}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-2xl leading-relaxed">
                      {inv.detail}
                    </p>

                    <div className="grid grid-cols-3 gap-4 border-t border-border/60 pt-4 max-w-xl">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Total Tagihan</div>
                        <div className="text-lg font-black" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>
                          {inv.amount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Poin Didapat</div>
                        <div className="text-sm font-bold text-amber-500">
                          +{inv.points} poin
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Tanggal Invoice</div>
                        <div className="text-xs font-bold text-foreground mt-0.5">
                          {inv.date}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 md:self-center flex flex-col sm:flex-row gap-2">
                    {inv.status === "pending-payment" && (
                      <>
                        <button 
                          onClick={() => { setSelectedId(inv.id); setPayStep("pay"); }} 
                          className="w-full md:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-98 transition-all"
                          style={{ background: "#800000" }}
                        >
                          Bayar Sekarang
                        </button>
                        <button 
                          onClick={() => handleCancelInvoice(inv.id)} 
                          disabled={cancelling !== null}
                          className="w-full md:w-auto px-5 py-3 rounded-xl text-xs font-bold text-red-700 border border-red-200 shadow-xs hover:bg-red-50 active:scale-98 transition-all disabled:opacity-50"
                        >
                          {cancelling === inv.id ? "Memproses..." : "Batalkan Pesanan"}
                        </button>
                      </>
                    )}
                    {inv.status === "waiting-verification" && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-2.5">
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Menunggu Konfirmasi Admin</span>
                      </div>
                    )}
                    {inv.status === "verified" && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50/50 border border-green-100 rounded-xl px-4 py-2.5">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Pembayaran Lunas</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 px-6 bg-white rounded-3xl border border-border flex flex-col items-center justify-center text-center max-w-4xl shadow-xs">
          <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-sm text-foreground mb-1">
            Tidak ada invoice tagihan
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Semua tagihan Anda telah lunas atau belum ada invoice yang diterbitkan untuk akun Anda.
          </p>
        </div>
      )}

      {/* Payment Overlay Modal */}
      {payStep && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={resetModal}
          />
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-150 border border-border">
            {/* Header Modal */}
            <div className="p-5 flex justify-between items-center text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #800000, #4a0000)" }}>
              <div>
                <div className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Pembayaran Tagihan</div>
                <div className="text-[10px] text-white/70 font-mono mt-0.5">ID: {selectedInv.id}</div>
              </div>
              <button onClick={resetModal} className="text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
             {/* Modal Body */}
            <div className="p-6">
              {/* Invoice Summary */}
              <div className="bg-secondary/45 rounded-2xl p-4 mb-5 border border-border flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Layanan</div>
                  <div className="text-xs font-bold text-foreground line-clamp-1">{selectedInv.service}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Total Tagihan</div>
                  <div className="text-lg font-black" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>
                    {selectedInv.amount}
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="bg-amber-50/75 border border-amber-200/60 rounded-2xl p-4 mb-5 text-center">
                <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">
                  Batas Waktu Pembayaran (1x24 Jam)
                </div>
                <div className="text-2xl font-black text-amber-900 font-mono tracking-widest animate-pulse">
                  {timeLeft}
                </div>
                <div className="text-[10px] text-amber-600 mt-1">
                  Silakan lakukan pembayaran sebelum waktu habis untuk menghindari pembatalan otomatis.
                </div>
              </div>

              {isExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                  <h4 className="text-sm font-bold text-red-800">Tagihan Telah Kadaluarsa</h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Tagihan ini telah melebihi batas waktu pembayaran 24 jam. Silakan buat pesanan baru.
                  </p>
                </div>
              ) : selectedInv.snap_token ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => handleOpenMidtrans(selectedInv.snap_token)} 
                    className="w-full py-4 rounded-xl text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-98"
                    style={{ background: "#800000" }}
                  >
                    <CreditCard className="w-4 h-4" />
                    Bayar Sekarang (Midtrans)
                  </button>
                  <button 
                    onClick={() => handleCancelInvoice(selectedInv.id)} 
                    disabled={cancelling !== null}
                    className="w-full py-3 rounded-xl text-red-700 font-bold text-xs transition-all flex items-center justify-center gap-2 hover:bg-red-50 border border-red-200 disabled:opacity-50"
                  >
                    {cancelling === selectedInv.id ? "Memproses..." : "Batalkan Pesanan"}
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed mt-2">
                    Anda akan dialihkan ke popup aman Midtrans untuk menyelesaikan pembayaran melalui Virtual Account (BCA, Mandiri, dll.), QRIS, E-Wallet, atau Kartu Kredit.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4 text-center space-y-3">
                  <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
                  <div className="text-xs font-bold text-red-800">
                    Kunci Server Midtrans Belum Dikonfigurasi
                  </div>
                  <p className="text-[10px] text-red-700 leading-relaxed max-w-xs mx-auto">
                    Kunci Server Midtrans (`MIDTRANS_SERVER_KEY`) belum terpasang atau tidak valid di backend Laravel. Silakan isi file `.env` dengan kredensial Midtrans Sandbox/Production yang benar.
                  </p>
                  <button
                    onClick={fetchInvoices}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    Coba Hubungkan Ulang
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
