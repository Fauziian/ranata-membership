"use client";

import { useState, useEffect } from "react";
import { Search, Users, ShieldAlert, CheckCircle, Clock, Eye, Info, X } from "lucide-react";
import { adminApi, getToken } from "@/lib/api";
import { TierBadge } from "@/components/shared";
import { toast } from "sonner";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const fetchMembers = async (searchVal = "") => {
    try {
      setLoading(true);
      const res = await adminApi.getMembers(searchVal);
      if (res.success && res.data) {
        setMembers(res.data);
      } else {
        toast.error(res.message ?? "Gagal memuat daftar anggota.");
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
    
    // Simple debounce/delay for search query
    const delayDebounceFn = setTimeout(() => {
      fetchMembers(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const activeMembersCount = members.filter((m: any) => m.status === "Active").length;
  const averagePoints = members.length > 0
    ? Math.round(members.reduce((acc: number, m: any) => acc + m.points, 0) / members.length)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Manajemen Member
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          Kelola data keanggotaan eksklusif, pantau perolehan poin, dan tinjau status keanggotaan
        </p>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Anggota", value: members.length, icon: Users, color: "#800000" },
          { label: "Anggota Aktif", value: activeMembersCount, icon: CheckCircle, color: "#22C55E" },
          { label: "Anggota Inaktif", value: members.length - activeMembersCount, icon: ShieldAlert, color: "#EF4444" },
          { label: "Rata-rata Poin", value: averagePoints.toLocaleString("id-ID") + " Pts", icon: Clock, color: "#DAA520" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="text-xl font-black mb-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>{s.value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
        {/* Search bar */}
        <div className="p-4 border-b border-border bg-secondary/10 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama anggota atau ID member..."
              className="w-full pl-10 pr-4 py-2.5 border border-border bg-white rounded-xl text-xs outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/25 transition-all"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/25 border-b border-border">
                {["ID Member", "Nama Anggota", "Tier", "Poin Reward", "Bergabung", "Status", "No. Telepon", "Aksi"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <div className="w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <div className="text-xs font-bold">Memuat data anggota...</div>
                  </td>
                </tr>
              ) : members.length > 0 ? (
                members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono font-semibold text-muted-foreground">{m.member_id || m.id}</td>
                    <td className="px-5 py-4 text-xs font-bold text-foreground">{m.name}</td>
                    <td className="px-5 py-4">
                      <TierBadge tier={m.tier} />
                    </td>
                    <td className="px-5 py-4 text-xs font-black" style={{ color: "#DAA520" }}>
                      {m.points.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{m.joined}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        m.status === "Active" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {m.status === "Active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{m.phone || "-"}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-bold hover:bg-secondary/40 transition-colors"
                        style={{ color: "#800000" }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <Info className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                    <div className="text-xs font-bold">Tidak ada data anggota ditemukan</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Silakan gunakan kata kunci pencarian lain</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex justify-between items-center" style={{ background: "linear-gradient(135deg, #800000, #500000)" }}>
              <div className="text-white font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Detail Profil Anggota
              </div>
              <button 
                onClick={() => setSelectedMember(null)} 
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #800000, #400000)" }}
                >
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{selectedMember.name}</h3>
                  <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">{selectedMember.member_id || selectedMember.id}</div>
                </div>
                <div className="ml-auto">
                  <TierBadge tier={selectedMember.tier} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Status Akun</div>
                  <div className="font-bold mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedMember.status === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                    {selectedMember.status === "Active" ? "Aktif" : "Nonaktif"}
                  </div>
                </div>
                
                <div>
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Total Poin</div>
                  <div className="font-black mt-0.5 text-yellow-600">
                    {selectedMember.points.toLocaleString("id-ID")} Poin
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Nomor Telepon</div>
                  <div className="font-semibold mt-0.5">{selectedMember.phone}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Bergabung Sejak</div>
                  <div className="font-semibold mt-0.5">{selectedMember.joined}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Alamat Domisili (Mock)</div>
                  <div className="font-semibold mt-0.5 text-foreground leading-normal">
                    Jl. Jenderal Sudirman No. 45, Kebayoran Baru, Jakarta Selatan
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-secondary/35 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#800000" }}
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
