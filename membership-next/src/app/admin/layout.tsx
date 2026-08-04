"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, LogOut, LayoutDashboard, Map, Users, CreditCard,
  Award, Settings, Menu, X, ChevronRight, MessageCircle
} from "lucide-react";
import { RanataLogo } from "@/components/shared";
import { useIsMobile } from "@/components/ui/use-mobile";
import { getTransactionsList } from "@/lib/data-fetchers";
import { adminApi } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Sidebar open/collapse state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Close mobile drawer when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Read transactions list to get dynamic pending count
  const allTxs = getTransactionsList ? getTransactionsList() : [];
  const pendingTxCount = allTxs.filter((t: any) => t.status === "pending").length;

  useEffect(() => {
    const checkUnreadChats = async () => {
      try {
        const res = await adminApi.getChats();
        if (res.success && res.data) {
          const sessions = res.data;
          const count = sessions.filter((s: any) => {
            if (!s.messages || s.messages.length === 0) return false;
            const lastMsg = s.messages[s.messages.length - 1];
            return lastMsg.sender === "customer" && !s.is_handled_by_ai;
          }).length;
          setUnreadChatCount(count);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkUnreadChats();
    const interval = setInterval(checkUnreadChats, 3000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { label: "Beranda Admin", path: "/admin", icon: LayoutDashboard },
    { label: "Chat Layanan", path: "/admin/chat", icon: MessageCircle, badge: unreadChatCount },
    { label: "Pemantauan Posisi", path: "/admin/map", icon: Map },
    { label: "Manajemen Member", path: "/admin/members", icon: Users },
    { label: "Verifikasi Pembayaran", path: "/admin/transactions", icon: CreditCard, badge: pendingTxCount },
    { label: "Laporan Poin", path: "/admin/points", icon: Award },
    { label: "Pengaturan Sistem", path: "/admin/settings", icon: Settings },
  ];

  const handleLogout = () => {
    // Clear simulation / direct back to landing
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── SIDEBAR (DESKTOP) ── */}
      <aside
        className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen sticky top-0 h-screen overflow-y-auto flex-shrink-0 transition-all duration-300"
        style={{ background: "linear-gradient(180deg, #800000 0%, #500000 100%)" }}
      >
        <div className="p-4 border-b border-white/10">
          <RanataLogo size="sm" />
          <div 
            className="mt-3 px-2.5 py-1 rounded-lg bg-white/10 text-white/70 text-[9px] font-bold text-center tracking-widest"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ADMIN PANEL
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
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto text-[10px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center bg-red-500 animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-white/20">
              A
            </div>
            <div>
              <div className="text-white text-xs font-semibold">Admin Ranata</div>
              <div className="text-white/50 text-[10px]">Super Administrator</div>
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
        style={{ background: "linear-gradient(180deg, #800000 0%, #500000 100%)" }}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <RanataLogo size="sm" />
          <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-4 py-2 mt-3">
          <div 
            className="px-2.5 py-1 rounded-lg bg-white/10 text-white/70 text-[9px] font-bold text-center tracking-widest"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ADMIN PANEL
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
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto text-[10px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center bg-red-500">
                    {item.badge}
                  </span>
                ) : null}
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
        {/* HEADER (MOBILE & TABLET TABS) */}
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm flex-shrink-0 h-14 flex items-center">
          <div className="w-full px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                aria-label="Toggle Sidebar"
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              <Link href="/admin" className="flex items-center gap-2">
                <RanataLogo size="sm" />
                <span className="hidden sm:inline-block font-mono text-[9px] bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Admin Panel
                </span>
              </Link>
            </div>

            {/* Right section: Super Admin badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-background rounded-xl px-2.5 py-1.5 border border-border">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: "#800000" }}
                >
                  A
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-semibold leading-none mb-0.5">Admin Ranata</div>
                  <div className="text-[9px] text-muted-foreground font-semibold leading-none">Super Admin</div>
                </div>
              </div>
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
