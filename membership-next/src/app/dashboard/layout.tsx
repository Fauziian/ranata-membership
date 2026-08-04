"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, LogOut, LayoutDashboard, MessageCircle, CreditCard,
  Navigation, Gift, History, User, Menu, X, ChevronRight, Award
} from "lucide-react";
import { RanataLogo, TierBadge } from "@/components/shared";
import { getMemberProfile, getNotifications } from "@/lib/data-fetchers";
import { useIsMobile } from "@/components/ui/use-mobile";
import { memberApi, getToken, setStoredUser } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Sidebar open/collapse state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications panel state
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile data fetch
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateProfile = () => {
      setProfile(getMemberProfile());
    };
    updateProfile();
    window.addEventListener("profile-updated", updateProfile);

    // Also fetch live profile from API to keep badge accurate
    const token = getToken();
    if (token) {
      memberApi.getProfile().then((res) => {
        if (res.success && res.data) {
          setStoredUser(res.data);
          setProfile({
            id: res.data.member_id,
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone || "Belum diatur",
            tier: res.data.tier,
            points: res.data.points,
            address: res.data.address || "Belum diatur",
            city: res.data.city || "Belum diatur",
            birthdate: res.data.birthdate || "Belum diatur",
            avatar: res.data.avatar || null,
          });
        }
      }).catch(() => {});
    }

    return () => window.removeEventListener("profile-updated", updateProfile);
  }, []);

  const notifications = getNotifications();
  const [pendingInvoices, setPendingInvoices] = useState(0);

  const fetchPendingInvoicesCount = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await memberApi.getInvoices();
      if (res.success && Array.isArray(res.data)) {
        const count = res.data.filter((inv: any) => inv.status === "pending-payment").length;
        setPendingInvoices(count);
      }
    } catch (err) {
      console.error("[Layout Fetch Invoices Error]", err);
    }
  };

  useEffect(() => {
    fetchPendingInvoicesCount();
    window.addEventListener("invoices-updated", fetchPendingInvoicesCount);
    return () => window.removeEventListener("invoices-updated", fetchPendingInvoicesCount);
  }, []);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    if (showNotif) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotif]);

  // Sidebar items
  const menuItems = [
    { label: "Dashboard Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Beli Membership", path: "/dashboard/membership", icon: Award },
    { label: "Request Layanan", path: "/dashboard/layanan", icon: MessageCircle },
    { label: "Tagihan & Bayar", path: "/dashboard/tagihan", icon: CreditCard, badge: pendingInvoices },
    { label: "Status Perjalanan", path: "/dashboard/perjalanan", icon: Navigation },
    { label: "Tukar Poin", path: "/dashboard/redeem", icon: Gift },
    { label: "Riwayat Transaksi", path: "/dashboard/riwayat", icon: History },
    { label: "Profil Saya", path: "/dashboard/profil", icon: User },
  ];

  const handleLogout = () => {
    // Clear simulation / direct back to landing
    router.push("/");
  };

  // Derive profile completion status from live profile state
  const isProfileComplete = Boolean(
    profile?.birthdate && profile.birthdate !== "Belum diatur" &&
    profile?.city && profile.city !== "Belum diatur" && profile.city !== "Kota Anda" &&
    profile?.address && profile.address !== "Belum diatur"
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── SIDEBAR (DESKTOP) ── */}
      <aside
        className={`hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen sticky top-0 h-screen overflow-y-auto flex-shrink-0 transition-all duration-300`}
        style={{ background: "linear-gradient(180deg, #800000 0%, #4a0000 100%)" }}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <RanataLogo size="sm" />
        </div>
        <div className="px-4 py-2 mt-3">
          <div className="px-2.5 py-1 rounded-lg bg-white/10 text-white/70 text-[9px] font-medium text-center tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
            MEMBER AREA
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                  isActive
                    ? "bg-white/20 text-white font-semibold shadow-lg"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {/* Tagihan badge */}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto text-[10px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center bg-red-500">
                    {item.badge}
                  </span>
                ) : null}
                {/* Profile incomplete orange ! badge */}
                {item.path === "/dashboard/profil" && !isProfileComplete && (
                  <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center bg-orange-500 text-white text-[10px] font-black shadow-md animate-pulse">
                    !
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-white/20">
                {profile?.name ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "..."}
              </div>
            )}
            <div>
              <div className="text-white text-xs font-semibold">{profile?.name || "Loading..."}</div>
              <div className="text-white/50 text-[10px]">{profile?.id || "..."}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[999] md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-card z-[1000] md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "linear-gradient(180deg, #800000 0%, #4a0000 100%)" }}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <RanataLogo size="sm" />
          <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                  isActive
                    ? "bg-white/20 text-white font-semibold shadow-lg"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {/* Tagihan badge */}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto text-[10px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center bg-red-500">
                    {item.badge}
                  </span>
                ) : null}
                {/* Profile incomplete orange ! badge */}
                {item.path === "/dashboard/profil" && !isProfileComplete && (
                  <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center bg-orange-500 text-white text-[10px] font-black shadow-md animate-pulse">
                    !
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm flex-shrink-0 h-14">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                aria-label="Toggle Sidebar"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              {/* Logo / Brand link back to overview */}
              <Link href="/dashboard" className="flex-shrink-0">
                <RanataLogo size="sm" />
              </Link>
            </div>

            {/* Right Header Section: notif + profile */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotif(v => !v)}
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-background hover:bg-secondary transition-colors border border-border"
                  aria-label="Notifikasi"
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {pendingInvoices > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[8px] font-bold text-white flex items-center justify-center bg-red-500"
                    >
                      {pendingInvoices}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotif && (
                  <div
                    className="absolute right-0 w-80 bg-white rounded-2xl shadow-2xl border border-border mt-2 overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Notifikasi</span>
                      <button
                        onClick={() => setShowNotif(false)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((n, i) => (
                        <Link
                          key={i}
                          href={`/dashboard/${n.targetTab}`}
                          onClick={() => setShowNotif(false)}
                          className="flex items-start gap-3 px-4 py-3.5 hover:bg-background cursor-pointer border-b border-border last:border-0 transition-colors text-left"
                        >
                          <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.dot }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold">{n.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">{n.time}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="p-3 border-t border-border">
                      <Link
                        href="/dashboard/riwayat"
                        onClick={() => setShowNotif(false)}
                        className="w-full block text-center text-xs font-semibold py-2 rounded-lg hover:bg-secondary transition-colors"
                        style={{ color: "#800000" }}
                      >
                        Lihat Semua Notifikasi
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile chip */}
              <Link
                href="/dashboard/profil"
                className="flex items-center gap-2 bg-background rounded-xl px-2.5 py-1.5 border border-border cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 animate-in fade-in duration-200"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: "#800000" }}
                  >
                    {profile?.name ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "..."}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-[11px] font-semibold leading-none mb-0.5">{profile?.name || "Loading..."}</div>
                  <TierBadge tier={profile?.tier || "Bronze"} />
                </div>
                {/* Profile incomplete indicator on header chip */}
                {!isProfileComplete && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center bg-orange-500 text-white text-[9px] font-black flex-shrink-0 shadow-sm animate-pulse">
                    !
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
