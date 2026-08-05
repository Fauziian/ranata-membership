"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Award, CreditCard, Shield, Save, RefreshCw, 
  HelpCircle, Globe, ToggleLeft, ToggleRight, MapPin
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  tierSilverMin: number;
  tierGoldMin: number;
  tierPlatinumMin: number;
  pointsMultiplier: number;
  bankBcaName: string;
  bankBcaNo: string;
  bankMandiriName: string;
  bankMandiriNo: string;
  autoApproveSim: boolean;
  maintenanceMode: boolean;
  adminWhatsapp: string;
  officeAddress: string;
  officeLat: number;
  officeLng: number;
}

const defaultSettings: SystemSettings = {
  tierSilverMin: 2000,
  tierGoldMin: 6000,
  tierPlatinumMin: 12000,
  pointsMultiplier: 100000, // Rp 100.000 = 1 Point
  bankBcaName: "CV RANATA TOUR & TRAVEL",
  bankBcaNo: "8009-1234-56",
  bankMandiriName: "CV RANATA TOUR UTAMA",
  bankMandiriNo: "137-00-98765-43",
  autoApproveSim: false,
  maintenanceMode: false,
  adminWhatsapp: "+6281234567890",
  officeAddress: "1A Ruko G, Husein Sastranegara, Kec. Cicendo, Kota Bandung, Jawa Barat 40174",
  officeLat: -6.902482,
  officeLng: 107.575442
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ranata_settings");
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          setSettings(defaultSettings);
        }
      } else {
        localStorage.setItem("ranata_settings", JSON.stringify(defaultSettings));
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("ranata_settings", JSON.stringify(settings));
      }
      setLoading(false);
      toast.success("Pengaturan sistem berhasil disimpan!", {
        description: "Perubahan konfigurasi tier dan bank pembayaran telah diterapkan secara global."
      });
    }, 500);
  };

  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin mereset seluruh pengaturan ke default?")) {
      setSettings(defaultSettings);
      if (typeof window !== "undefined") {
        localStorage.setItem("ranata_settings", JSON.stringify(defaultSettings));
      }
      toast.info("Pengaturan direset ke kondisi default.");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Konfigurasi tiering loyalitas member, metode pembayaran, dan preferensi platform
          </p>
        </div>
        
        <button 
          onClick={handleReset}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-red-600 bg-white hover:bg-red-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Default
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Inputs grouped in cards) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Loyalty Tiers configuration */}
          <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Konfigurasi Ambang Batas Tier Poin
              </h3>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Silver (Min Poin)
                </label>
                <input
                  type="number"
                  required
                  value={settings.tierSilverMin}
                  onChange={e => setSettings({ ...settings, tierSilverMin: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Gold (Min Poin)
                </label>
                <input
                  type="number"
                  required
                  value={settings.tierGoldMin}
                  onChange={e => setSettings({ ...settings, tierGoldMin: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Platinum (Min Poin)
                </label>
                <input
                  type="number"
                  required
                  value={settings.tierPlatinumMin}
                  onChange={e => setSettings({ ...settings, tierPlatinumMin: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Konversi Nilai Poin (Rasio Transaksi)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Tiap kelipatan belanja</span>
                <input
                  type="number"
                  required
                  value={settings.pointsMultiplier}
                  onChange={e => setSettings({ ...settings, pointsMultiplier: Number(e.target.value) })}
                  className="w-36 px-4 py-2 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors text-center font-bold"
                />
                <span className="text-xs text-muted-foreground">Rupiah mendapat 1 Reward Point</span>
              </div>
            </div>
          </div>

          {/* Card 2: Bank accounts settings */}
          <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Rekening Bank Penerima Pembayaran
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nama Rekening BCA
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.bankBcaName}
                    onChange={e => setSettings({ ...settings, bankBcaName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nomor Rekening BCA
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.bankBcaNo}
                    onChange={e => setSettings({ ...settings, bankBcaNo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nama Rekening Mandiri
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.bankMandiriName}
                    onChange={e => setSettings({ ...settings, bankMandiriName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nomor Rekening Mandiri
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.bankMandiriNo}
                    onChange={e => setSettings({ ...settings, bankMandiriNo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Platform Preferences */}
          <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Pengaturan Umum & Kontak Admin
              </h3>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                WhatsApp Admin CS (Format Internasional)
              </label>
              <input
                type="text"
                required
                value={settings.adminWhatsapp}
                onChange={e => setSettings({ ...settings, adminWhatsapp: e.target.value })}
                placeholder="+62812xxxxxx"
                className="w-full max-w-sm px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Card 4: Office Location & GPS Origin */}
          <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <MapPin className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Lokasi Kantor Pusat & Koordinat Origin Map
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Alamat Kantor Pusat
                </label>
                <textarea
                  required
                  rows={2}
                  value={settings.officeAddress}
                  onChange={e => setSettings({ ...settings, officeAddress: e.target.value })}
                  placeholder="Masukkan alamat lengkap kantor pusat..."
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Latitude Origin
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={settings.officeLat}
                    onChange={e => setSettings({ ...settings, officeLat: Number(e.target.value) })}
                    placeholder="-6.xxxxx"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Longitude Origin
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={settings.officeLng}
                    onChange={e => setSettings({ ...settings, officeLng: Number(e.target.value) })}
                    placeholder="107.xxxxx"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Control Bar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-border p-6 shadow-xs space-y-6">
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Status Sistem & Aksi
            </h3>

            {/* Simulated options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">Auto-Verify Transfer</div>
                  <div className="text-[10px] text-muted-foreground">Terima otomatis bukti bayar</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, autoApproveSim: !settings.autoApproveSim })}
                  className="text-primary hover:opacity-90 transition-opacity"
                >
                  {settings.autoApproveSim ? (
                    <ToggleRight className="w-9 h-9 text-[#800000]" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-muted-foreground/60" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">Mode Perbaikan (Maintenance)</div>
                  <div className="text-[10px] text-muted-foreground">Kunci akses frontend portal</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className="text-primary hover:opacity-90 transition-opacity"
                >
                  {settings.maintenanceMode ? (
                    <ToggleRight className="w-9 h-9 text-red-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-muted-foreground/60" />
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ background: "#800000" }}
              >
                <Save className="w-4 h-4" />
                {loading ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
          
          {/* Security alert */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 flex gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-800">Catatan Keamanan</h4>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Pengaturan yang Anda ubah di sini disimpan secara lokal di browser Anda. Mode produksi sesungguhnya akan disinkronkan ke database Laravel API.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
