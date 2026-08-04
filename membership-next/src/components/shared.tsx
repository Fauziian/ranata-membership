"use client";

import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Tier } from "@/types";

// ─── RanataLogo ────────────────────────────────────────────────────────────────
// Identik dengan versi App.tsx, menggunakan next/image (fallback behavior identik)
export function RanataLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const [err, setErr] = useState(false);
  const h = size === "sm" ? "h-10" : size === "lg" ? "h-16" : "h-12";
  const dim = size === "sm" ? 40 : size === "lg" ? 64 : 48;
  if (err) {
    return (
      <div className={`${h} inline-flex items-center gap-2.5`}>
        <div
          className="rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
          style={{ width: dim, height: dim, background: "linear-gradient(135deg,#800000,#5a0000)", fontSize: dim * 0.42, fontFamily: "Montserrat, sans-serif" }}
        >
          R
        </div>
        <div>
          <div className="font-black leading-none" style={{ fontFamily: "Montserrat, sans-serif", color: "#800000", fontSize: dim * 0.28 }}>Ranata</div>
          <div className="leading-none mt-0.5" style={{ color: "#DAA520", fontSize: dim * 0.2, fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>Tour | MICE | Umroh</div>
        </div>
      </div>
    );
  }
  return (
    <Image
      src="/images/image-10.png"
      alt="Ranata Tour & Travel"
      width={dim * 3}
      height={dim}
      className={`${h} w-auto object-contain`}
      style={{ width: "auto" }}
      onError={() => setErr(true)}
    />
  );
}

// ─── TierBadge ────────────────────────────────────────────────────────────────
// Identik dengan versi App.tsx
export function TierBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "md" }) {
  const configs: Record<Tier, { gradient: string; text: string }> = {
    Platinum: { gradient: "linear-gradient(135deg, #B0C4DE 0%, #8899AA 100%)", text: "#2a3a4a" },
    Gold: { gradient: "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)", text: "#4a2800" },
    Silver: { gradient: "linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)", text: "#2a2a2a" },
    Bronze: { gradient: "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)", text: "#2a1000" },
  };
  const c = configs[tier];
  const p = size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${p}`} style={{ background: c.gradient, color: c.text }}>
      <Star className="w-2.5 h-2.5 fill-current" />
      {tier.toUpperCase()}
    </span>
  );
}

// ─── StatusPill ────────────────────────────────────────────────────────────────
// Identik dengan versi App.tsx
import type { TxStatus } from "@/types";

export function StatusPill({ status }: { status: TxStatus }) {
  const map = {
    pending: { label: "Menunggu", cls: "bg-yellow-100 text-yellow-800" },
    verified: { label: "Terverifikasi", cls: "bg-green-100 text-green-800" },
    rejected: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
  };
  const s = map[status];
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

// ─── TravelPin ────────────────────────────────────────────────────────────────
// Identik dengan versi App.tsx
import type { TravelStatus } from "@/types";

export function TravelPin({ status }: { status: TravelStatus }) {
  const color = status === "waiting" ? "#EF4444" : status === "in-progress" ? "#F59E0B" : "#22C55E";
  return (
    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${status !== "done" ? "animate-pulse" : ""}`} style={{ background: color }} />
  );
}
