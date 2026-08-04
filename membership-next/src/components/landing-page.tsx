"use client";

import { useState, useEffect } from "react";
import {
  Navigation, Plane, Hotel, Star, Shield, CreditCard,
  ArrowRight, Sparkles, ChevronDown, CheckCircle,
  MapPin, Phone, Mail
} from "lucide-react";

// Social media SVG icons — lucide-react v1.x tidak memiliki brand icons
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function IconTwitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16M4 20L20 4"/><path d="M4 4h4l12 12v4h-4L4 8z"/>
    </svg>
  );
}
import { useRouter } from "next/navigation";
import { RanataLogo, TierBadge } from "@/components/shared";

// ─── Hero Slides ───────────────────────────────────────────────────────────────
const heroSlides = [
  { url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=800&fit=crop&auto=format", label: "Tegallalang, Bali" },
  { url: "https://images.unsplash.com/photo-1703769605307-395ace742240?w=1600&h=800&fit=crop&auto=format", label: "Raja Ampat, Papua Barat" },
  { url: "https://images.unsplash.com/photo-1680100628674-26233c804e19?w=1600&h=800&fit=crop&auto=format", label: "Borobudur, Yogyakarta" },
  { url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1600&h=800&fit=crop&auto=format", label: "Pura Ulun Danu, Bali" },
  { url: "https://images.unsplash.com/photo-1700591698351-f8131b0f5d3c?w=1600&h=800&fit=crop&auto=format", label: "Labuan Bajo, NTT" },
];

// ─── HeroSection ──────────────────────────────────────────────────────────────
// Identik 100% dengan App.tsx
function HeroSection({ onOpenLogin }: { onOpenLogin: (t: "login" | "register") => void }) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const total = heroSlides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % total);
        setTransitioning(false);
      }, 900);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="beranda" className="relative overflow-hidden flex items-center" style={{ minHeight: 580 }}>
      {/* Sliding strip */}
      <div
        className="absolute inset-0"
        style={{
          display: "flex",
          width: `${total * 100}%`,
          transform: `translateX(-${(current * 100) / total}%)`,
          transition: transitioning ? "none" : "transform 1s cubic-bezier(0.77,0,0.175,1)",
        }}
      >
        {heroSlides.map((slide, i) => (
          <div key={i} style={{ width: `${100 / total}%`, flexShrink: 0, position: "relative" }}>
            <img
              src={slide.url}
              alt={slide.label}
              className="w-full h-full object-cover"
              style={{ height: "100%" }}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(128,0,0,0.93) 0%, rgba(70,0,0,0.82) 50%, rgba(30,0,0,0.55) 100%)" }} />

      {/* Floating gold orb */}
      <div className="absolute right-24 top-1/4 w-72 h-72 rounded-full opacity-8 hero-float pointer-events-none" style={{ background: "radial-gradient(circle, rgba(218,165,32,0.35), transparent 70%)", filter: "blur(50px)" }} />

      {/* Slide label badge */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5">
          <span className="text-white/80 text-[11px] font-medium">{heroSlides[current].label}</span>
        </div>
        <div className="flex gap-1.5">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="transition-all"
              style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, background: i === current ? "#DAA520" : "rgba(255,255,255,0.4)" }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 mb-5 px-4 py-2 rounded-full border border-white/20" style={{ fontFamily: "Montserrat, sans-serif", animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            MEMBERSHIP EKSKLUSIF RANATA TOUR
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5" style={{ fontFamily: "Montserrat, sans-serif", animation: "fadeSlideUp 0.5s ease 0.2s both" }}>
            Eksplorasi Dunia<br />
            <span style={{ color: "#DAA520" }}>dengan Kenyamanan</span><br />
            Tanpa Batas
          </h1>
          <p className="text-white/75 text-lg mb-8 leading-relaxed" style={{ animation: "fadeSlideUp 0.5s ease 0.3s both" }}>
            Program membership eksklusif Ranata Tour — full handling service dari rumah hingga hotel. Bergabunglah dan nikmati perjalanan tanpa hambatan.
          </p>
          <div className="flex flex-wrap gap-4" style={{ animation: "fadeSlideUp 0.5s ease 0.4s both" }}>
            <button onClick={() => onOpenLogin("register")} className="shimmer-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold shadow-xl">
              Jelajahi Layanan Kami <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onOpenLogin("login")} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors">
              Sudah Punya Akun
            </button>
          </div>
          <div className="flex items-center gap-8 mt-10" style={{ animation: "fadeSlideUp 0.5s ease 0.5s both" }}>
            {[["10.000+", "Member Aktif"], ["15+", "Tahun Pengalaman"], ["50+", "Destinasi"]].map(([n, l], i) => (
              <div key={l} className="stat-anim" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif", color: "#DAA520" }}>{n}</div>
                <div className="text-white/60 text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────
// Identik 100% dengan App.tsx — termasuk scroll reveal observer
interface LandingPageProps {
  onOpenLogin: (tab: "login" | "register") => void;
}

export function LandingPage({ onOpenLogin }: LandingPageProps) {
  const router = useRouter();
  const [paketsOpen, setPaketsOpen] = useState(false);

  // Navigasi ke halaman tier sesungguhnya via URL
  const goToTier = (tier: "Silver" | "Gold" | "Platinum") => {
    router.push(`/membership/${tier.toLowerCase()}`);
    setPaketsOpen(false);
  };

  // Scroll-reveal observer — sama persis dengan App.tsx
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll(".scroll-reveal");
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <RanataLogo size="sm" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
            <a href="#beranda" className="nav-underline hover:text-primary transition-colors">Beranda</a>

            {/* Paket Membership — hover-triggered 3D dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPaketsOpen(true)}
              onMouseLeave={() => setPaketsOpen(false)}
            >
              <button className={`flex items-center gap-1 transition-colors font-medium nav-underline ${paketsOpen ? "text-primary" : "hover:text-primary"}`}>
                Paket Membership
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${paketsOpen ? "rotate-180" : ""}`} />
              </button>
              {paketsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-2">
                  <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden dropdown-animate" style={{ width: 300 }}>
                    {/* header stripe */}
                    <div className="px-4 py-3 border-b border-border" style={{ background: "linear-gradient(135deg,#800000,#5a0000)" }}>
                      <div className="text-white/60 text-[10px] font-bold tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>PILIH PAKET MEMBERSHIP</div>
                    </div>
                    {(["Silver", "Gold", "Platinum"] as const).map((t, i) => {
                      const prices = ["Rp 2.500.000", "Rp 5.000.000", "Rp 10.000.000"];
                      const descs = ["Transportasi & layanan dasar", "Handling bandara penuh", "Full handling end-to-end"];
                      const icons = ["🥈", "🥇", "💎"];
                      return (
                        <button
                          key={t}
                          onClick={() => goToTier(t)}
                          className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-background transition-all text-left group border-b border-border last:border-0"
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ background: "rgba(128,0,0,0.07)" }}>
                            {icons[i]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "Montserrat, sans-serif" }}>
                              Membership {t}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{descs[i]}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[11px] font-bold" style={{ color: "#800000" }}>{prices[i]}</div>
                            <div className="text-[10px] text-muted-foreground">/tahun</div>
                          </div>
                        </button>
                      );
                    })}
                    <div className="px-4 py-3 bg-background">
                      <div className="text-[11px] text-muted-foreground text-center">Klik tier untuk melihat detail lengkap →</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="#keuntungan-member" className="nav-underline hover:text-primary transition-colors">Keuntungan Member</a>
            <a href="#kontak" className="nav-underline hover:text-primary transition-colors">Kontak</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenLogin("login")} className="px-4 py-2 text-sm font-semibold text-primary border-2 border-primary rounded-xl hover:bg-secondary transition-all hover:scale-105">
              Masuk
            </button>
            <button onClick={() => onOpenLogin("register")} className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:scale-105 hover:shadow-lg" style={{ background: "linear-gradient(135deg,#800000,#5a0000)" }}>
              Daftar Member
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection onOpenLogin={onOpenLogin} />

      {/* Keuntungan Member */}
      <section id="keuntungan-member" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 scroll-reveal">
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000" }}>Keuntungan Menjadi Member</h2>
            <p className="text-muted-foreground text-sm">Full handling service dari rumah hingga check-in hotel</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Navigation, title: "Penjemputan dari Rumah", desc: "Tim kami menjemput Anda dari rumah dan mengantar ke bandara dengan nyaman." },
              { icon: Plane, title: "Handling Bandara", desc: "Check-in, boarding pass, dan semua proses bandara ditangani tim Ranata." },
              { icon: Hotel, title: "Handling Hotel", desc: "Sesampainya di tujuan, langsung diantar dan check-in hotel tanpa antri." },
              { icon: Star, title: "Sistem Poin Reward", desc: "Setiap transaksi menghasilkan poin yang bisa ditukar layanan gratis." },
              { icon: Shield, title: "Layanan 24/7", desc: "Tim kami siap membantu kapanpun selama perjalanan Anda." },
              { icon: CreditCard, title: "Pembayaran Mudah", desc: "Bayar via Virtual Account atau QRIS. Invoice langsung di dashboard Anda." },
            ].map((a, i) => (
              <div key={a.title} className="card-3d scroll-reveal bg-background rounded-2xl p-6 border border-border" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: "rgba(128,0,0,0.08)" }}>
                  <a.icon className="w-5 h-5" style={{ color: "#800000" }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>{a.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier & Harga */}
      <section id="tier-&-harga" className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10 scroll-reveal">
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000" }}>Tier & Harga Membership</h2>
            <p className="text-muted-foreground text-sm">Pilih tier yang sesuai dengan kebutuhan perjalanan Anda</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Silver" as const, price: "Rp 2.500.000", period: "/tahun", welcome: "500 poin", features: ["Sewa Transportasi ke Bandara", "Layanan 24/7 via Chat", "Poin setiap transaksi", "Akses dashboard member"] },
              { name: "Gold" as const, price: "Rp 5.000.000", period: "/tahun", welcome: "1.200 poin", features: ["Semua benefit Silver", "Handling di Bandara (check-in & boarding)", "Jemput di bandara tujuan", "Diskon 10% semua layanan"] },
              { name: "Platinum" as const, price: "Rp 10.000.000", period: "/tahun", welcome: "3.000 poin", features: ["Semua benefit Gold", "Penjemputan dari rumah", "Handling penuh bandara + hotel", "Check-in hotel diurus tim", "Personal consultant", "Diskon 15% semua layanan"] },
            ].map((t, i) => (
              <div key={t.name} className={`card-3d scroll-reveal bg-white rounded-2xl border-2 p-6 relative ${i === 2 ? "border-primary shadow-2xl" : "border-border"}`} style={{ transitionDelay: `${i * 0.1}s` }}>
                {i === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white badge-glow" style={{ background: "#800000" }}>TERPOPULER</div>}
                <TierBadge tier={t.name} size="md" />
                <div className="mt-4 mb-1"><span className="text-2xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>{t.price}</span><span className="text-muted-foreground text-xs">{t.period}</span></div>
                <div className="text-xs text-muted-foreground mb-5">Termasuk <strong>{t.welcome}</strong> welcome bonus</div>
                <ul className="space-y-2 mb-6">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#800000" }} />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onOpenLogin("register")} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 hover:shadow-md" style={i === 2 ? { background: "#800000", color: "#fff" } : { background: "#f5e8e8", color: "#800000" }}>
                  Pilih Tier {t.name}
                </button>
                <button onClick={() => goToTier(t.name)} className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-primary transition-colors text-center">
                  Lihat detail lengkap →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Bergabung */}
      <section id="cara-bergabung" className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10 scroll-reveal">
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000" }}>Cara Bergabung</h2>
            <p className="text-muted-foreground text-sm">Mulai perjalanan premium Anda dalam 4 langkah mudah</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "01", title: "Daftar Akun", desc: "Isi formulir pendaftaran atau login dengan Google" },
              { n: "02", title: "Pilih Tier", desc: "Pilih Silver, Gold, atau Platinum sesuai kebutuhan" },
              { n: "03", title: "Lakukan Pembayaran", desc: "Bayar via VA atau QRIS dan upload bukti transfer" },
              { n: "04", title: "Mulai Menikmati", desc: "Tier aktif, badge muncul, poin masuk, layanan siap!" },
            ].map((s, i) => (
              <div key={s.n} className="text-center scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-xl transition-transform hover:scale-110 hover:rotate-3" style={{ background: "linear-gradient(135deg,#800000,#5a0000)", fontFamily: "Montserrat, sans-serif", boxShadow: "0 8px 24px rgba(128,0,0,0.25)" }}>{s.n}</div>
                <h4 className="font-bold text-sm mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>{s.title}</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 scroll-reveal" style={{ background: "linear-gradient(135deg, #800000 0%, #500000 60%, #2a0000 100%)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="hero-float inline-block mb-4"><Sparkles className="w-8 h-8 text-yellow-400 mx-auto" /></div>
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>Mulai Perjalanan Premium Anda</h2>
          <p className="text-white/70 mb-7 text-sm">Daftar sekarang dan dapatkan 500 poin welcome bonus untuk Tier Silver</p>
          <button onClick={() => onOpenLogin("register")} className="shimmer-btn inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm shadow-2xl transition-all">
            Daftar Gratis Sekarang <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <RanataLogo size="sm" />
              <p className="text-gray-400 text-xs mt-4 leading-relaxed">Platform membership eksklusif untuk perjalanan premium bersama Ranata Tour & Travel.</p>
              <div className="flex items-center gap-3 mt-5">
                {[IconInstagram, IconFacebook, IconTwitter].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-400 mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>RANATA AIR NETWORK</div>
              {["Tiket Domestik", "Tiket Internasional", "Paket Umroh", "MICE & Korporat"].map(l => (
                <a key={l} href="#" className="block text-gray-400 hover:text-white text-xs mb-2 transition-colors">{l}</a>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-400 mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>LOKASI KANTOR</div>
              <div className="flex items-start gap-2 text-gray-400 text-xs mb-3">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#DAA520" }} />
                <span>Jl. Sudirman No. 45, Jakarta Pusat, DKI Jakarta 10220</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#DAA520" }} />
                <span>(021) 5555-7890</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#DAA520" }} />
                <span>info@ranatatour.co.id</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-gray-500 text-xs">© 2026 Ranata Tour & Travel. All rights reserved.</p>
            <p className="text-gray-500 text-xs">Terdaftar di Kemenparekraf RI No. 123/KPAR/2010</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
