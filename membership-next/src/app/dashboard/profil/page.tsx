"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Hash, Settings, CheckCircle, AlertCircle, Eye,
  ChevronRight, Camera, Upload, MapPin
} from "lucide-react";
import { TierBadge } from "@/components/shared";
import { getMemberProfile } from "@/lib/data-fetchers";
import { memberApi, setStoredUser } from "@/lib/api";
import { toast } from "sonner";

// Component helpers declared outside of render function to avoid focus loss bug on state changes
interface BioData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  birthdate: string;
  memberId: string;
}

const Field = ({
  label, value, field, type = "text", readOnly = false, placeholder = "", bioEditing, onChange
}: {
  label: string; value: string; field: keyof BioData;
  type?: string; readOnly?: boolean; placeholder?: string;
  bioEditing: boolean;
  onChange: (field: keyof BioData, val: string) => void;
}) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        readOnly={readOnly || !bioEditing}
        placeholder={placeholder}
        onChange={e => !readOnly && onChange(field, e.target.value)}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none ${
          readOnly
            ? "bg-secondary/50 text-muted-foreground border-border cursor-not-allowed"
            : bioEditing
              ? "bg-white border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
              : "bg-background border-border text-foreground"
        }`}
      />
      {readOnly && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">Tidak dapat diubah</span>
        </div>
      )}
    </div>
  </div>
);

const PwdField = ({
  label, fieldKey, value, onChange, show, onToggleShow
}: {
  label: string;
  fieldKey: "current" | "newPwd" | "confirm";
  value: string;
  onChange: (field: "current" | "newPwd" | "confirm", val: string) => void;
  show: boolean;
  onToggleShow: (field: "current" | "newPwd" | "confirm") => void;
}) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder="••••••••"
        onChange={e => onChange(fieldKey, e.target.value)}
        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all pr-10"
      />
      <button
        type="button"
        onClick={() => onToggleShow(fieldKey)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default function CustomerProfilePage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [initialProfile, setInitialProfile] = useState<any>(null);

  // Bio data state
  const [bio, setBio] = useState<BioData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    birthdate: "",
    memberId: "",
  });

  useEffect(() => {
    setIsMounted(true);
    const prof = getMemberProfile();
    setInitialProfile(prof);
    setAvatarPreview(prof.avatar);
    setBio({
      name: prof.name || "",
      email: prof.email || "member@ranatatour.com",
      phone: prof.phone || "",
      address: prof.address === "Belum diatur" ? "" : prof.address || "",
      city: prof.city === "Belum diatur" ? "" : prof.city || "",
      birthdate: prof.birthdate === "Belum diatur" ? "" : prof.birthdate || "",
      memberId: prof.id || "",
    });
  }, []);

  // Password change state
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });

  // UI state
  const [bioEditing, setBioEditing] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung deteksi lokasi (GPS).");
      return;
    }

    setGpsLoading(true);
    toast.loading("Mendeteksi lokasi GPS Anda...", { id: "gps-fetch" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (response.ok) {
            const data = await response.json();
            const displayName = data.display_name || "";
            const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.county || "";
            
            setBio(b => ({
              ...b,
              city: city,
              address: displayName
            }));
            toast.success("Lokasi GPS berhasil dideteksi!", { id: "gps-fetch" });
          } else {
            toast.error("Gagal mendapatkan detail alamat dari GPS.", { id: "gps-fetch" });
          }
        } catch (error) {
          toast.error("Terjadi kesalahan saat menghubungi server peta.", { id: "gps-fetch" });
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        let errorMsg = "Gagal mendeteksi lokasi GPS Anda.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Akses lokasi ditolak. Silakan izinkan akses lokasi (GPS) pada browser Anda.";
        }
        toast.error(errorMsg, { id: "gps-fetch" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Local Profile Image Preview State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setAvatarBase64(base64String);
        setBioEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const saveBio = async () => {
    try {
      const res = await memberApi.updateProfile({
        name: bio.name,
        phone: bio.phone,
        city: bio.city,
        address: bio.address,
        birthdate: bio.birthdate,
        ...(avatarBase64 ? { avatar: avatarBase64 } : {}),
      });

      if (res.success && res.data) {
        setStoredUser(res.data);
        window.dispatchEvent(new Event("profile-updated"));
        setInitialProfile(res.data);
        setAvatarBase64(null);
        setBioSaved(true);
        setBioEditing(false);
        toast.success("Profil berhasil diperbarui!");
        setTimeout(() => setBioSaved(false), 3000);
      } else {
        toast.error(res.message || "Gagal memperbarui profil");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan profil");
    }
  };

  const cancelEdit = () => {
    setBioEditing(false);
    if (initialProfile) {
      setBio({
        name: initialProfile.name || "",
        email: initialProfile.email || "member@ranatatour.com",
        phone: initialProfile.phone || "",
        address: initialProfile.address === "Belum diatur" ? "" : initialProfile.address || "",
        city: initialProfile.city === "Belum diatur" ? "" : initialProfile.city || "",
        birthdate: initialProfile.birthdate === "Belum diatur" ? "" : initialProfile.birthdate || "",
        memberId: initialProfile.id || "",
      });
      setAvatarPreview(initialProfile.avatar);
      setAvatarBase64(null);
    }
  };

  const savePwd = () => {
    if (!pwd.current) { setPwdError("Masukkan password saat ini"); return; }
    if (pwd.newPwd.length < 8) { setPwdError("Password baru minimal 8 karakter"); return; }
    if (pwd.newPwd !== pwd.confirm) { setPwdError("Konfirmasi password tidak cocok"); return; }
    setPwdError("");
    setPwd({ current: "", newPwd: "", confirm: "" });
    setPwdSaved(true);
    setTimeout(() => setPwdSaved(false), 3000);
  };

  const handleBioChange = (field: keyof BioData, val: string) => {
    setBio(b => ({ ...b, [field]: val }));
  };

  const handlePwdChange = (field: "current" | "newPwd" | "confirm", val: string) => {
    setPwd(p => ({ ...p, [field]: val }));
  };

  const handleToggleShowPwd = (field: "current" | "newPwd" | "confirm") => {
    setShowPwd(s => ({ ...s, [field]: !s[field] }));
  };

  if (!isMounted || !initialProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: "#800000", borderTopColor: "transparent" }} />
        <p className="text-sm font-semibold text-muted-foreground">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Kembali ke Dashboard
      </button>

      {/* Avatar & identity card */}
      <div className="relative rounded-3xl overflow-hidden p-7 mb-6 text-white flex items-center gap-6"
        style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 60%, #2a0000 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(218,165,32,0.4) 0%, transparent 60%)" }} />
        
        {/* Interactive Avatar Container */}
        <div 
          onClick={triggerFileSelect}
          className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 border-2 border-white/30 overflow-hidden cursor-pointer group hover:border-white transition-all"
          title="Ubah Foto Profil (Preview Lokal)"
        >
          {avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt="Avatar Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-white/80 group-hover:scale-95 transition-transform" />
          )}
          {/* Overlay Hover Effect */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="relative">
          <TierBadge tier={initialProfile.tier} size="md" />
          <h1 className="text-2xl font-black mt-2 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{bio.name}</h1>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Hash className="w-3.5 h-3.5" />
            <span>{bio.memberId}</span>
          </div>
        </div>
      </div>

      {/* Persuasive profile completion banner */}
      {(!bio.birthdate || !bio.city || !bio.address) && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-6 flex gap-4 items-start shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Lengkapi Data Profil Anda 🎁
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Lengkapi Tanggal Lahir dan Alamat Domisili Anda untuk menikmati promo diskon ulang tahun dan kemudahan booking.
            </p>
          </div>
        </div>
      )}

      {/* Bio data card */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Data Profil</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Informasi personal Anda</p>
          </div>
          {bioSaved ? (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
              <CheckCircle className="w-4 h-4" /> Tersimpan!
            </div>
          ) : bioEditing ? (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveBio}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                style={{ background: "#800000" }}
              >
                Simpan Perubahan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setBioEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Edit Profil
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama Lengkap" value={bio.name} field="name" placeholder="Nama lengkap Anda" bioEditing={bioEditing} onChange={handleBioChange} />
          <Field label="Email (tidak dapat diubah)" value={bio.email} field="email" type="email" readOnly bioEditing={bioEditing} onChange={handleBioChange} />
          <Field label="Nomor HP / WhatsApp" value={bio.phone} field="phone" placeholder="08xx-xxxx-xxxx" bioEditing={bioEditing} onChange={handleBioChange} />
          <Field label="Tanggal Lahir" value={bio.birthdate} field="birthdate" type="date" bioEditing={bioEditing} onChange={handleBioChange} />
          <Field label="Kota Domisili" value={bio.city} field="city" placeholder="Kota Anda" bioEditing={bioEditing} onChange={handleBioChange} />
          <Field label="Nomor Member (tidak dapat diubah)" value={bio.memberId} field="memberId" readOnly bioEditing={bioEditing} onChange={handleBioChange} />
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-muted-foreground">Alamat</label>
              {bioEditing && (
                <button
                  type="button"
                  onClick={handleUseGPS}
                  disabled={gpsLoading}
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-2 py-1 rounded-lg border border-amber-200 transition-all select-none disabled:opacity-50"
                >
                  <MapPin className="w-3 h-3" />
                  {gpsLoading ? "Mendeteksi..." : "Gunakan GPS / Lokasi Saat Ini"}
                </button>
              )}
            </div>
            <textarea
              value={bio.address}
              readOnly={!bioEditing}
              rows={2}
              onChange={e => setBio(b => ({ ...b, address: e.target.value }))}
              placeholder="Belum diatur"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none resize-none ${
                bioEditing
                  ? "bg-white border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  : "bg-background border-border text-foreground"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="mb-5">
          <h2 className="font-black text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Ubah Password</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pastikan password baru minimal 8 karakter</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <PwdField label="Password Saat Ini" fieldKey="current" value={pwd.current} onChange={handlePwdChange} show={showPwd.current} onToggleShow={handleToggleShowPwd} />
          <PwdField label="Password Baru" fieldKey="newPwd" value={pwd.newPwd} onChange={handlePwdChange} show={showPwd.newPwd} onToggleShow={handleToggleShowPwd} />
          <PwdField label="Konfirmasi Password Baru" fieldKey="confirm" value={pwd.confirm} onChange={handlePwdChange} show={showPwd.confirm} onToggleShow={handleToggleShowPwd} />
        </div>


        {pwdError && (
          <div className="flex items-center gap-2 text-red-600 text-xs mb-3 bg-red-50 rounded-xl px-4 py-2.5 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {pwdError}
          </div>
        )}
        {pwdSaved && (
          <div className="flex items-center gap-2 text-green-600 text-xs mb-3 bg-green-50 rounded-xl px-4 py-2.5 border border-green-200">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Password berhasil diubah!
          </div>
        )}

        <button
          onClick={savePwd}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#800000" }}
        >
          Simpan Password Baru
        </button>
      </div>
    </div>
  );
}
