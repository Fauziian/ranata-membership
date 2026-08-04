"use client";

import { useState } from "react";
import {
  Car, Star, MessageCircle, CreditCard, LayoutDashboard, Shield,
  Plane, Navigation, Hotel, User, Award, CheckCircle, XCircle,
  ArrowRight, ChevronRight
} from "lucide-react";
import { RanataLogo, TierBadge } from "@/components/shared";
import type { Tier } from "@/types";

// ─── Tier Data ────────────────────────────────────────────────────────────────
// Identik dengan tierData di App.tsx — tidak ada perubahan nilai
const tierData = {
  Silver: {
    name: "Silver" as Tier,
    price: "Rp 2.500.000",
    period: "/tahun",
    welcome: "500 poin",
    tagline: "Mulai perjalanan nyaman dengan kemudahan transportasi eksklusif dari pintu rumah Anda.",
    heroImg: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1600&h=700&fit=crop&auto=format",
    heroAlt: "Sawah hijau Bali yang memukau",
    accent: "#A0A0A0",
    gradient: "linear-gradient(135deg, #800000 0%, #4a0000 100%)",
    description: "Membership Silver adalah pintu masuk ke dunia perjalanan premium bersama Ranata Tour. Dengan bergabung sebagai anggota Silver, Anda mendapatkan kemudahan transportasi dari rumah ke bandara, layanan chat prioritas 24/7, serta sistem poin reward di setiap transaksi. Cocok untuk Anda yang ingin merasakan kenyamanan layanan profesional tanpa harus repot mengurus logistik sendiri.",
    benefits: [
      { icon: Car, title: "Transportasi Rumah → Bandara", desc: "Tim driver Ranata Tour menjemput dari depan pintu rumah Anda dan mengantar langsung ke terminal keberangkatan tepat waktu." },
      { icon: Star, title: "Poin Reward Setiap Transaksi", desc: "Setiap pembelian tiket, hotel, atau layanan melalui Ranata Tour menghasilkan poin yang bisa ditukar reward menarik." },
      { icon: MessageCircle, title: "Chat Admin 24/7", desc: "Akses langsung ke tim admin Ranata Tour kapanpun untuk konsultasi, request layanan, dan informasi perjalanan." },
      { icon: CreditCard, title: "Bayar via VA & QRIS", desc: "Invoice dikirim langsung ke dashboard Anda. Bayar dengan Virtual Account semua bank atau QRIS dari e-wallet manapun." },
      { icon: LayoutDashboard, title: "Dashboard Member Pribadi", desc: "Pantau riwayat transaksi, total poin, status perjalanan, dan semua layanan dalam satu tampilan dashboard yang rapi." },
      { icon: Shield, title: "Prioritas Layanan 24/7", desc: "Tim kami siap 24 jam penuh termasuk hari libur untuk memastikan perjalanan Anda berjalan tanpa hambatan." },
    ],
    destinations: [
      { name: "Bali", desc: "Pura, sawah, dan pantai eksotis", img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&h=400&fit=crop&auto=format", alt: "Pura Ulun Danu Bratan Bali" },
      { name: "Yogyakarta", desc: "Borobudur, Prambanan & Malioboro", img: "https://images.unsplash.com/photo-1680100628674-26233c804e19?w=600&h=400&fit=crop&auto=format", alt: "Candi Borobudur Yogyakarta" },
      { name: "Lombok", desc: "Pantai Pink, Gili, & Rinjani", img: "https://images.unsplash.com/photo-1700591698351-f8131b0f5d3c?w=600&h=400&fit=crop&auto=format", alt: "Pantai eksotis Lombok" },
    ],
    notIncluded: ["Handling di bandara (check-in & boarding)", "Penjemputan di bandara tujuan", "Handling check-in hotel", "Personal travel consultant"],
  },
  Gold: {
    name: "Gold" as Tier,
    price: "Rp 5.000.000",
    period: "/tahun",
    welcome: "1.200 poin",
    tagline: "Nikmati perjalanan tanpa hambatan — dari rumah hingga tiba di hotel tujuan Anda.",
    heroImg: "https://images.unsplash.com/photo-1703769605307-395ace742240?w=1600&h=700&fit=crop&auto=format",
    heroAlt: "Kepulauan Raja Ampat Papua Barat",
    accent: "#DAA520",
    gradient: "linear-gradient(135deg, #8B6914 0%, #5a4008 100%)",
    description: "Membership Gold dirancang untuk traveler yang menginginkan pengalaman perjalanan penuh tanpa kerumitan. Tim Ranata Tour akan mendampingi Anda mulai dari penjemputan di rumah, proses check-in dan boarding di bandara, hingga penjemputan di bandara tujuan. Nikmati diskon 10% untuk semua layanan dan kumpulkan poin 1.5× lebih cepat dari tier Silver.",
    benefits: [
      { icon: Car, title: "Transportasi Rumah → Bandara", desc: "Penjemputan dari rumah ke bandara keberangkatan dengan kendaraan premium dan driver profesional." },
      { icon: Plane, title: "Handling Bandara — Check-in & Boarding", desc: "Tim kami mendampingi check-in, pengurusan bagasi, dan boarding. Anda tidak perlu antri atau bingung di konter check-in." },
      { icon: Navigation, title: "Penjemputan di Bandara Tujuan", desc: "Sesampainya di bandara tujuan, tim lokal Ranata Tour sudah siap menjemput dan mengantar ke hotel atau destinasi Anda." },
      { icon: Star, title: "Poin 1.5× Setiap Transaksi", desc: "Kumpulkan poin lebih cepat dengan multiplier 1.5× — cocok untuk Anda yang sering bepergian dan ingin redeem lebih banyak." },
      { icon: Shield, title: "Diskon 10% Semua Layanan", desc: "Potongan harga 10% berlaku untuk tiket pesawat, hotel, transportasi, pengurusan dokumen, dan paket wisata." },
      { icon: MessageCircle, title: "Prioritas Antrian Chat Admin", desc: "Request Anda diproses lebih cepat — antrian prioritas Gold di atas Silver untuk semua permintaan layanan." },
    ],
    destinations: [
      { name: "Raja Ampat", desc: "Surga bawah laut Papua Barat", img: "https://images.unsplash.com/photo-1703769605293-2280634db93b?w=600&h=400&fit=crop&auto=format", alt: "Kepulauan Raja Ampat aerial view" },
      { name: "Labuan Bajo", desc: "Komodo, Padar & laut biru kristal", img: "https://images.unsplash.com/photo-1703769605314-18648cfc3428?w=600&h=400&fit=crop&auto=format", alt: "Pulau-pulau Labuan Bajo" },
      { name: "Pink Beach Komodo", desc: "Pantai pasir merah muda unik", img: "https://images.unsplash.com/photo-1747806735725-ad02ac970269?w=600&h=400&fit=crop&auto=format", alt: "Pink Beach Komodo Indonesia" },
    ],
    notIncluded: ["Handling check-in hotel oleh tim", "Personal travel consultant"],
  },
  Platinum: {
    name: "Platinum" as Tier,
    price: "Rp 10.000.000",
    period: "/tahun",
    welcome: "3.000 poin",
    tagline: "Perjalanan tanpa batas — dari kunci rumah hingga kunci kamar hotel, semua kami urus.",
    heroImg: "https://images.unsplash.com/photo-1557750505-e7b4d1c40410?w=1600&h=700&fit=crop&auto=format",
    heroAlt: "Infinity pool luxury resort",
    accent: "#DAA520",
    gradient: "linear-gradient(135deg, #800000 0%, #2a0000 100%)",
    description: "Membership Platinum adalah pengalaman perjalanan tertinggi yang ditawarkan Ranata Tour. Dengan layanan full handling end-to-end, tim kami mengurus segalanya — dari penjemputan di rumah, handling penuh di bandara, penjemputan di tujuan, hingga check-in hotel dilakukan oleh tim kami. Anda hanya perlu duduk, menikmati, dan hadir. Dilengkapi personal consultant, diskon 15%, poin 2×, dan akses lounge bandara premium.",
    benefits: [
      { icon: Car, title: "Penjemputan dari Rumah", desc: "Driver elite Ranata Tour menjemput tepat dari depan pintu Anda, mengantar ke bandara dengan kendaraan premium." },
      { icon: Plane, title: "Full Handling Bandara Keberangkatan", desc: "Check-in, bagasi, boarding pass — semua ditangani. Anda hanya datang dan duduk di kursi pesawat." },
      { icon: Navigation, title: "Full Handling Bandara Tujuan", desc: "Tim lokal kami sudah menunggu saat Anda mendarat. Koper diurus, langsung naik kendaraan menuju hotel." },
      { icon: Hotel, title: "Handling Check-in Hotel", desc: "Tiba di hotel, tim kami yang mengurus seluruh proses check-in. Kunci kamar langsung di tangan Anda tanpa antre." },
      { icon: User, title: "Personal Travel Consultant", desc: "Satu dedicated consultant yang mengenal preferensi Anda, siap merencanakan dan mengeksekusi setiap detail perjalanan." },
      { icon: Star, title: "Poin 2× Setiap Transaksi", desc: "Kumpulkan poin dua kali lebih cepat untuk ditukarkan dengan upgrade, layanan gratis, dan reward premium lainnya." },
      { icon: Shield, title: "Diskon 15% Semua Layanan", desc: "Potongan harga tertinggi 15% berlaku untuk seluruh produk Ranata Tour — tiket, hotel, wisata, dokumen, Umroh." },
      { icon: Award, title: "Priority Lounge 8 Bandara", desc: "Akses ruang tunggu premium di 8 bandara internasional di Indonesia sebelum setiap penerbangan." },
    ],
    destinations: [
      { name: "Bali Luxury", desc: "Villa private pool & resort bintang 5", img: "https://images.unsplash.com/photo-1697898109604-e06e88b15271?w=600&h=400&fit=crop&auto=format", alt: "Overwater villa luxury Bali" },
      { name: "Raja Ampat Premium", desc: "Private tour pulau terpencil", img: "https://images.unsplash.com/photo-1703769605307-395ace742240?w=600&h=400&fit=crop&auto=format", alt: "Raja Ampat premium" },
      { name: "Resort Eksklusif", desc: "Kolam infinity & kamar suite", img: "https://images.unsplash.com/photo-1675657144361-98ae33e6b6f9?w=600&h=400&fit=crop&auto=format", alt: "Luxury resort pool lounge" },
    ],
    notIncluded: [],
  },
};

// ─── TierDetailPage Component ─────────────────────────────────────────────────
// JSX identik 100% dengan TierDetailPage di App.tsx
interface TierDetailPageProps {
  tier: "Silver" | "Gold" | "Platinum";
  onBack: () => void;
  onOpenLogin: (t: "login" | "register") => void;
}

export function TierDetailPage({ tier, onBack, onOpenLogin }: TierDetailPageProps) {
  const d = tierData[tier];
  const accentStyle = tier === "Silver"
    ? { background: "linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)", color: "#2a2a2a" }
    : tier === "Gold"
    ? { background: "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)", color: "#4a2800" }
    : { background: "linear-gradient(135deg, #B0C4DE 0%, #8899AA 100%)", color: "#1a2a3a" };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
          </button>
          <div className="absolute left-1/2 -translate-x-1/2"><RanataLogo size="sm" /></div>
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenLogin("login")} className="px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-lg hover:bg-secondary transition-colors">Masuk</button>
            <button onClick={() => onOpenLogin("register")} className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity" style={{ background: "#800000" }}>Daftar Member</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden flex items-end" style={{ minHeight: 480 }}>
        <img src={d.heroImg} alt={d.heroAlt} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)" }} />
        <div className="relative max-w-7xl mx-auto px-8 pb-12 w-full">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="mb-3"><TierBadge tier={d.name} size="md" /></div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Membership {tier}
              </h1>
              <p className="text-white/80 text-lg max-w-xl leading-relaxed">{d.tagline}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-7 py-5 text-right">
              <div className="text-white/60 text-xs mb-1">Harga Membership</div>
              <div className="text-3xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>{d.price}<span className="text-sm font-normal text-white/60">{d.period}</span></div>
              <div className="text-white/70 text-xs mt-1">Termasuk <span style={{ color: "#DAA520" }}>{d.welcome}</span> welcome bonus</div>
              <button onClick={() => onOpenLogin("register")} className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105" style={{ background: "#DAA520", color: "#2a1800" }}>
                Daftar Sekarang
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Description */}
        <div className="bg-white rounded-2xl border border-border p-8 mb-10">
          <h2 className="text-xl font-black mb-4" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000" }}>
            Apa itu Membership {tier}?
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm">{d.description}</p>
        </div>

        {/* Benefits */}
        <h2 className="text-xl font-black mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000" }}>
          Benefit yang Anda Dapatkan
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {d.benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: "rgba(128,0,0,0.08)" }}>
                <b.icon className="w-6 h-6" style={{ color: "#800000" }} />
              </div>
              <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>{b.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Not included */}
        {d.notIncluded.length > 0 && (
          <div className="bg-gray-50 border border-border rounded-2xl p-6 mb-12">
            <h3 className="font-bold text-sm mb-4 text-muted-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>Tidak Termasuk dalam Tier {tier}</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {d.notIncluded.map((ni, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" /> {ni}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Destinasi */}
        <h2 className="text-xl font-black mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000" }}>
          Destinasi Populer Member {tier}
        </h2>
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {d.destinations.map((dest, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shadow-md group cursor-pointer hover:shadow-xl transition-shadow">
              <div className="relative h-52 overflow-hidden">
                <img src={dest.img} alt={dest.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(128,0,0,0.7) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="text-white font-black text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>{dest.name}</div>
                  <div className="text-white/80 text-xs">{dest.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-3xl overflow-hidden">
          <div className="p-10 text-center" style={{ background: d.gradient }}>
            <TierBadge tier={d.name} size="md" />
            <h2 className="text-2xl font-black text-white mt-4 mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Siap Bergabung sebagai Member {tier}?
            </h2>
            <p className="text-white/70 text-sm mb-7 max-w-lg mx-auto">
              Daftar sekarang dan nikmati {d.welcome} poin welcome bonus. Mulai perjalanan premium Anda bersama Ranata Tour.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={() => onOpenLogin("register")} className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-transform" style={{ background: "#DAA520", color: "#2a1800", fontFamily: "Montserrat, sans-serif" }}>
                Daftar Member {tier} <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={onBack} className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors">
                Lihat Tier Lain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
