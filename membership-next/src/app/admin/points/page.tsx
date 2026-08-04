"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, Star, Users, TrendingUp, Plus, Trash2, Edit3, 
  CheckCircle, AlertCircle, X, Gift, Check, Search
} from "lucide-react";
import { 
  getMembersList, 
  getRewardsList, 
  saveRewardsList 
} from "@/lib/data-fetchers";
import { TierBadge } from "@/components/shared";
import { toast } from "sonner";
import { adminApi, getToken } from "@/lib/api";
import { 
  Hotel, Car, Plane, Globe, Coffee, FileText, Building
} from "lucide-react";

const iconMap: Record<string, any> = {
  Hotel: Hotel,
  Car: Car,
  Plane: Plane,
  Globe: Globe,
  Coffee: Coffee,
  FileText: FileText,
  Building: Building,
  Star: Star
};

const iconOptions = ["Hotel", "Car", "Plane", "Globe", "Coffee", "FileText", "Building", "Star"];
const categoryOptions = ["Hotel", "Transport", "Tiket", "Wisata", "Kuliner", "Dokumen", "Fasilitas"];

export default function AdminPointsPage() {
  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<"reports" | "rewards">("reports");
  
  // Data State
  const [members, setMembers] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form state for Add/Edit Reward
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPoints, setFormPoints] = useState(100);
  const [formCategory, setFormCategory] = useState("Hotel");
  const [formIcon, setFormIcon] = useState("Hotel");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMembers, resRewards] = await Promise.all([
        adminApi.getMembers(),
        adminApi.getRewards()
      ]);

      if (resMembers.success && resMembers.data) {
        setMembers(resMembers.data);
      }
      if (resRewards.success && resRewards.data) {
        setRewards(resRewards.data);
      }
    } catch (err) {
      toast.error("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Points stats
  const totalPoints = members.reduce((sum: number, m: any) => sum + m.points, 0);
  const avgPoints = members.length > 0 ? Math.round(totalPoints / members.length) : 0;

  // Sorted members for ranking table
  const sortedMembers = [...members]
    .sort((a: any, b: any) => b.points - a.points);

  // Search filtered rewards
  const filteredRewards = rewards.filter((r: any) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingReward(null);
    setFormName("");
    setFormDesc("");
    setFormPoints(500);
    setFormCategory("Hotel");
    setFormIcon("Hotel");
    setIsModalOpen(true);
  };

  const openEditModal = (reward: any) => {
    setEditingReward(reward);
    setFormName(reward.name);
    setFormDesc(reward.desc || reward.description);
    setFormPoints(reward.points);
    setFormCategory(reward.category);
    // Resolve icon string
    const currentIcon = typeof reward.icon === "string" ? reward.icon : "Hotel";
    setFormIcon(currentIcon);
    setIsModalOpen(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDesc.trim()) {
      toast.error("Nama dan deskripsi wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formName,
        description: formDesc,
        points_required: Number(formPoints),
        category: formCategory,
        icon: formIcon
      };

      if (editingReward) {
        // Edit mode
        const res = await adminApi.updateReward(editingReward.id, payload);
        if (res.success) {
          toast.success("Reward berhasil diperbarui!");
          fetchData();
          setIsModalOpen(false);
        } else {
          toast.error(res.message ?? "Gagal memperbarui reward.");
        }
      } else {
        // Add mode
        const res = await adminApi.createReward(payload);
        if (res.success) {
          toast.success("Reward baru berhasil ditambahkan!");
          fetchData();
          setIsModalOpen(false);
        } else {
          toast.error(res.message ?? "Gagal menambahkan reward.");
        }
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReward = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus reward ini?")) {
      try {
        setSubmitting(true);
        const res = await adminApi.deleteReward(id);
        if (res.success) {
          toast.success("Reward berhasil dihapus dari katalog.");
          fetchData();
        } else {
          toast.error(res.message ?? "Gagal menghapus reward.");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan koneksi.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Laporan Poin & Katalog Reward
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          Kelola distribusi poin member serta katalog redeem reward penukaran poin
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSubTab("reports")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === "reports"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Laporan & Ringkasan Poin
        </button>
        <button
          onClick={() => setActiveSubTab("rewards")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeSubTab === "rewards"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Manajemen Katalog Reward
        </button>
      </div>

      {/* SUBTAB 1: REPORTS */}
      {activeSubTab === "reports" && (
        loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">Memuat laporan poin...</p>
          </div>
        ) : (
          <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-border shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-amber-500 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {totalPoints.toLocaleString("id-ID")}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Poin Beredar</div>
              <p className="text-[10px] text-muted-foreground mt-2">Poin aktif di seluruh dompet member</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 border border-border shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-foreground mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                12.450
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ditukarkan Bulan Ini</div>
              <p className="text-[10px] text-muted-foreground mt-2">Akumulasi klaim voucher reward member</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-border shadow-xs">
              <div className="text-2xl md:text-3xl font-black text-foreground mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {avgPoints.toLocaleString("id-ID")}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rata-Rata Poin / Member</div>
              <p className="text-[10px] text-muted-foreground mt-2">Rasio persebaran poin loyalitas member</p>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Peringkat Loyalitas Member (Poin Tertinggi)
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Daftar member diurutkan berdasarkan poin terbanyak</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/25 border-b border-border">
                    {["Peringkat", "ID Member", "Nama Member", "Tier", "Total Poin", "No. Telepon", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {sortedMembers.map((m: any, idx: number) => (
                    <tr key={m.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground">#{idx + 1}</td>
                      <td className="px-5 py-4 font-mono text-muted-foreground">{m.id}</td>
                      <td className="px-5 py-4 font-semibold text-foreground">{m.name}</td>
                      <td className="px-5 py-4">
                        <TierBadge tier={m.tier} />
                      </td>
                      <td className="px-5 py-4 font-black text-amber-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {m.points.toLocaleString("id-ID")} Pts
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{m.phone}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === "Active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"
                        }`}>
                          {m.status === "Active" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    )}

      {/* SUBTAB 2: REWARDS CATALOG */}
      {activeSubTab === "rewards" && (
        loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">Memuat katalog reward...</p>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:max-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kategori reward..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <button
              onClick={openAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs"
              style={{ background: "#800000" }}
            >
              <Plus className="w-4 h-4" />
              Tambah Reward Baru
            </button>
          </div>

          {/* Grid rewards */}
          {filteredRewards.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRewards.map((r: any) => {
                const IconComponent = typeof r.icon === "string" ? (iconMap[r.icon] || Gift) : (r.icon || Gift);
                return (
                  <div 
                    key={r.id}
                    className="bg-white rounded-3xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col h-full group relative"
                  >
                    {/* Category tag */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-muted-foreground border border-border shadow-xs">
                        {r.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/5 border border-primary/10 mt-0.5 flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="font-bold text-xs md:text-sm text-foreground leading-snug" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {r.name}
                        </h4>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-grow line-clamp-3">
                        {r.desc}
                      </p>

                      <div className="flex items-center gap-1.5 mb-5 mt-auto">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-black text-xs md:text-sm text-amber-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {r.points.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">poin</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 border-t border-border pt-4 mt-auto">
                        <button
                          onClick={() => openEditModal(r)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReward(r.id)}
                          className="flex items-center justify-center w-9 h-9 border border-red-200 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-border">
              <Gift className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-foreground mb-1">Katalog reward kosong</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Belum ada reward yang cocok dengan pencarian Anda. Coba kata kunci lainnya.
              </p>
            </div>
          )}
        </div>
      )
    )}

      {/* ADD/EDIT REWARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          
          <form 
            onSubmit={handleSaveReward}
            className="bg-white rounded-3xl border border-border w-full max-w-lg p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4.5">
              <h3 className="font-bold text-sm md:text-base text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {editingReward ? "Edit Detail Reward" : "Tambah Reward Baru"}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Nama Reward</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Voucher Diskon Umroh 10%"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Deskripsi Benefit</label>
                <textarea
                  required
                  rows={3}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Tuliskan ketentuan dan kegunaan voucher secara jelas..."
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Biaya Poin</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={formPoints}
                    onChange={e => setFormPoints(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary bg-white transition-colors"
                  >
                    {categoryOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Pilih Ikon Visual</label>
                <div className="grid grid-cols-4 gap-2">
                  {iconOptions.map(opt => {
                    const TargetIcon = iconMap[opt];
                    const isSelected = formIcon === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormIcon(opt)}
                        className={`flex flex-col items-center justify-center p-2.5 border rounded-xl transition-all gap-1 ${
                          isSelected 
                            ? "border-primary bg-primary/5 text-primary font-bold" 
                            : "border-border text-muted-foreground hover:bg-secondary/40"
                        }`}
                      >
                        <TargetIcon className="w-4 h-4" />
                        <span className="text-[9px]">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="px-4.5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: "#800000" }}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : editingReward ? (
                  "Simpan Perubahan"
                ) : (
                  "Buat Reward"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
