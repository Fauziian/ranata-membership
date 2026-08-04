"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, Shield, Eye, EyeOff } from "lucide-react";
import { RanataLogo, TierBadge } from "@/components/shared";
import { authApi, setToken, setStoredUser } from "@/lib/api";
import { toast } from "sonner";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read tab from query params, default to "login"
  const tabParam = searchParams.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState<"login" | "register">(tabParam);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleId, setGoogleId] = useState("");
  const [avatar, setAvatar] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const nameParam = searchParams.get("name");
    const googleIdParam = searchParams.get("google_id");
    const avatarParam = searchParams.get("avatar");
    const err = searchParams.get("error");

    if (emailParam) setEmail(emailParam);
    if (nameParam) setName(nameParam);
    if (googleIdParam) setGoogleId(googleIdParam);
    if (avatarParam) setAvatar(avatarParam);

    if (err === "email_exists_manual") {
      toast.error("Email ini sudah terdaftar secara manual. Silakan login dengan password.");
    } else if (err === "google_failed") {
      toast.error("Gagal melakukan login menggunakan Google.");
    }
  }, [searchParams]);

  const handleTabChange = (t: "login" | "register") => {
    setTab(t);
    router.replace(`/auth?tab=${t}`);
  };

  const handleBack = () => {
    router.push("/");
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const res = await authApi.getGoogleUrl();
      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Gagal mendapatkan link login Google.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) {
      toast.error("Silakan isi email dan password.");
      return;
    }

    setLoading(false);

    try {
      setLoading(true);
      if (tab === "login") {
        const res = await authApi.login(email, pass);
        if (res.success && res.data) {
          setToken(res.data.token);
          setStoredUser(res.data.user);
          toast.success("Login berhasil!");
          
          if (res.data.user.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard"); // Pergi ke Dashboard Next.js
          }
        } else {
          toast.error(res.message ?? "Email atau password salah.");
        }
      } else {
        if (!name || !phone) {
          toast.error("Silakan lengkapi nama dan nomor WhatsApp.");
          setLoading(false);
          return;
        }

        if (pass !== confirmPass) {
          toast.error("Password dan Konfirmasi Password tidak cocok.");
          setLoading(false);
          return;
        }

        const res = await authApi.register({
          name,
          email,
          password: pass,
          password_confirmation: confirmPass,
          phone,
          ...(googleId ? { google_id: googleId } : {}),
          ...(avatar ? { avatar } : {}),
        });

        if (res.success && res.data) {
          setToken(res.data.token);
          setStoredUser(res.data.user);
          toast.success("Pendaftaran berhasil!");
          router.push("/dashboard");
        } else {
          if (res.errors) {
            const errs = Object.values(res.errors).flat().join("\n");
            toast.error(errs);
          } else {
            toast.error(res.message ?? "Registrasi gagal.");
          }
        }
      }
    } catch (err) {
      toast.error("Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsAdmin = async () => {
    // Quick shortcut: set default credential and attempt login
    setEmail("admin@ranatatour.com");
    setPass("admin123");
    toast.info("Gunakan kredensial admin default...");
  };

  return (
    <div className="min-h-screen flex" style={{ animation: "authPageIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex flex-col w-5/12 relative overflow-hidden" style={{ background: "linear-gradient(155deg, #800000 0%, #500000 55%, #2a0000 100%)" }}>
        <img
          src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=1100&fit=crop&auto=format"
          alt=""
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(218,165,32,0.25) 0%, transparent 55%)" }} />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative p-8">
          <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </button>
        </div>

        <div className="relative flex-1 flex flex-col justify-center px-10 pb-12">
          <RanataLogo size="lg" />
          <h2 className="text-3xl font-black text-white mt-7 mb-3 leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Selamat Datang di<br /><span style={{ color: "#DAA520" }}>Ranata Membership</span>
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-9">
            Platform eksklusif perjalanan premium. Full handling dari depan rumah hingga kunci kamar hotel Anda.
          </p>

          {/* Tier preview cards */}
          <div className="space-y-3">
            {(["Silver", "Gold", "Platinum"] as const).map((t, i) => {
              const descs = ["Transportasi & layanan dasar", "Full handling bandara", "End-to-end premium"];
              const prices = ["2.500.000", "5.000.000", "10.000.000"];
              return (
                <div key={t} className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/10 backdrop-blur-sm"
                     style={{ background: "rgba(255,255,255,0.07)" }}>
                  <TierBadge tier={t} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold">{descs[i]}</div>
                  </div>
                  <div className="text-white/50 text-[11px] font-medium whitespace-nowrap">Rp {prices[i]}/th</div>
                </div>
              );
            })}
          </div>

          {/* Bottom trust badge */}
          <div className="mt-8 flex items-center gap-3 text-white/40 text-[11px]">
            <Shield className="w-3.5 h-3.5" />
            <span>Terdaftar di Kemenparekraf RI • Data terenkripsi SSL</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
          </button>
          <RanataLogo size="sm" />
          <div className="w-16" />
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[420px]" style={{ animation: "slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>

            {/* Tab switcher */}
            <div className="flex rounded-2xl overflow-hidden border-2 border-border mb-8 p-1 bg-background">
              {(["login", "register"] as const).map(t => (
                <button key={t} onClick={() => handleTabChange(t)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300"
                  style={tab === t
                    ? { background: "#800000", color: "#fff", fontFamily: "Montserrat, sans-serif", boxShadow: "0 4px 16px rgba(128,0,0,0.25)" }
                    : { color: "#6b6b6b", fontFamily: "Montserrat, sans-serif" }}>
                  {t === "login" ? "Masuk" : "Daftar Member"}
                </button>
              ))}
            </div>

            <div>
              <h1 className="text-2xl font-black mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {tab === "login" ? "Selamat Datang Kembali 👋" : "Buat Akun Member"}
              </h1>
              <p className="text-muted-foreground text-sm mb-7">
                {tab === "login"
                  ? "Masuk ke dashboard membership eksklusif Anda"
                  : "Bergabung dan nikmati layanan premium Ranata Tour"}
              </p>
            </div>
            {/* Fields */}
            <form onSubmit={handleSubmit}>
              <div>
                {tab === "register" && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-1.5 text-foreground">Nama Lengkap *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Ahmad Fauzi" required
                      className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40" />
                  </div>
                )}
                {tab === "register" && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-1.5 text-foreground">Nomor WhatsApp *</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08123456789" type="tel" required
                      className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40" />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Email *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@contoh.com" required
                    className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40" />
                </div>
                <div className="mb-4 relative">
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Password *</label>
                  <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="••••••••" required
                    className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40 pr-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-9 text-muted-foreground hover:text-primary transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {tab === "register" && (
                  <div className="mb-7 relative">
                    <label className="block text-xs font-semibold mb-1.5 text-foreground">Konfirmasi Password *</label>
                    <input value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type={showConfirmPass ? "text" : "password"} placeholder="••••••••" required
                      className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40 pr-12" />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-9 text-muted-foreground hover:text-primary transition-colors">
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm mb-3 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #800000 0%, #5a0000 100%)", fontFamily: "Montserrat, sans-serif", boxShadow: "0 8px 32px rgba(128,0,0,0.28)" }}>
                {loading ? "Memproses..." : (tab === "login" ? "Masuk ke Akun" : "Buat Akun Member")}
              </button>
            </form>
            
            <button onClick={handleLoginAsAdmin}
              className="w-full py-3.5 rounded-2xl text-primary font-semibold text-xs bg-secondary hover:bg-secondary/70 transition-colors border border-border">
              Isi Default Admin Kredensial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
