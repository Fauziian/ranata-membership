"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/landing-page";

// ─── Root Page — Halaman Landing (//) ─────────────────────────────────────────
// Navigasi ke auth & membership menggunakan URL sesungguhnya via next/navigation
export default function Home() {
  const router = useRouter();

  const openAuth = (tab: "login" | "register") => {
    router.push(`/auth?tab=${tab}`);
  };

  return <LandingPage onOpenLogin={openAuth} />;
}
