import { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Plane, Hotel, Car, FileText, Star, Bell, User, MessageCircle,
  Gift, Users, Settings, LogOut, CheckCircle, XCircle,
  Clock, CreditCard, Award, TrendingUp, Home, X, ArrowRight, Send,
  Globe, Phone, Mail, Instagram, Facebook, MapPin, Search,
  Coffee, Shield, Download, Filter, Wallet,
  AlertCircle, Eye, Map, RefreshCw, Twitter, ChevronDown,
  Building, Check, LayoutDashboard, Zap, Hash, QrCode, Sparkles,
  History, Upload, ChevronRight, Navigation, Package
} from "lucide-react";
import ranaatLogo from "@/imports/image-10.png";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Page = "landing" | "customer" | "admin";
type CustomerTab = "dashboard" | "layanan" | "tagihan" | "perjalanan" | "redeem" | "riwayat" | "profil";
type AdminTab = "overview" | "map" | "members" | "transactions" | "points" | "settings";
type Tier = "Platinum" | "Gold" | "Silver" | "Bronze";
type TravelStatus = "waiting" | "in-progress" | "done";
type TxStatus = "pending" | "verified" | "rejected";
type InvStatus = "pending-payment" | "waiting-verification" | "verified" | "rejected";
interface ChatMessage { id: number; sender: "customer" | "admin"; text: string; time: string; }

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const mockMembers = [
  { id: "RT-2024-001", name: "Ahmad Fauzi", tier: "Platinum" as Tier, points: 12450, joined: "Jan 2022", status: "Active", phone: "0812-3456-7890" },
  { id: "RT-2024-002", name: "Siti Rahayu", tier: "Gold" as Tier, points: 7820, joined: "Mar 2022", status: "Active", phone: "0813-4567-8901" },
  { id: "RT-2024-003", name: "Budi Santoso", tier: "Gold" as Tier, points: 6540, joined: "Jun 2022", status: "Active", phone: "0814-5678-9012" },
  { id: "RT-2024-004", name: "Dewi Lestari", tier: "Silver" as Tier, points: 3200, joined: "Sep 2022", status: "Active", phone: "0815-6789-0123" },
  { id: "RT-2024-005", name: "Eko Prasetyo", tier: "Silver" as Tier, points: 2890, joined: "Nov 2022", status: "Inactive", phone: "0816-7890-1234" },
  { id: "RT-2024-006", name: "Fitri Handayani", tier: "Bronze" as Tier, points: 1200, joined: "Feb 2023", status: "Active", phone: "0817-8901-2345" },
  { id: "RT-2024-007", name: "Gunawan Wibowo", tier: "Platinum" as Tier, points: 18920, joined: "Des 2021", status: "Active", phone: "0818-9012-3456" },
  { id: "RT-2024-008", name: "Hana Putri", tier: "Bronze" as Tier, points: 980, joined: "Mei 2023", status: "Active", phone: "0819-0123-4567" },
];

const mockTransactions = [
  { id: "TRX-001", member: "Ahmad Fauzi", service: "Paket Umroh Premium", amount: "Rp 28.500.000", date: "20 Jul 2026", status: "pending" as TxStatus, proof: "transfer_bca_001.jpg", points: 285 },
  { id: "TRX-002", member: "Siti Rahayu", service: "Tiket Pesawat CGK-DPS", amount: "Rp 1.250.000", date: "19 Jul 2026", status: "verified" as TxStatus, proof: "bukti_transfer.jpg", points: 12 },
  { id: "TRX-003", member: "Budi Santoso", service: "Hotel Bintang 5 Bali 3N", amount: "Rp 4.800.000", date: "18 Jul 2026", status: "pending" as TxStatus, proof: "transfer_mandiri.jpg", points: 48 },
  { id: "TRX-004", member: "Dewi Lestari", service: "Sewa Alphard 3 Hari", amount: "Rp 2.100.000", date: "17 Jul 2026", status: "rejected" as TxStatus, proof: "transfer_bri.jpg", points: 21 },
  { id: "TRX-005", member: "Eko Prasetyo", service: "Wisata Raja Ampat 5D4N", amount: "Rp 12.750.000", date: "16 Jul 2026", status: "verified" as TxStatus, proof: "bukti_bayar_005.jpg", points: 127 },
  { id: "TRX-006", member: "Gunawan Wibowo", service: "Business Class JKT-SIN", amount: "Rp 8.600.000", date: "15 Jul 2026", status: "pending" as TxStatus, proof: "transfer_bca_006.jpg", points: 86 },
];

const mockTravelers = [
  { id: 1, name: "Ahmad Fauzi", location: "Bandara Ngurah Rai, Bali", status: "waiting" as TravelStatus, service: "Jemput Bandara", lat: -8.748, lng: 115.167 },
  { id: 2, name: "Siti Rahayu", location: "Hotel Grand Hyatt, Jakarta", status: "done" as TravelStatus, service: "Antar Hotel", lat: -6.208, lng: 106.822 },
  { id: 3, name: "Budi Santoso", location: "Gili Trawangan, Lombok", status: "in-progress" as TravelStatus, service: "Paket Tour", lat: -8.352, lng: 115.756 },
  { id: 4, name: "Gunawan Wibowo", location: "Bandara Juanda, Surabaya", status: "waiting" as TravelStatus, service: "Jemput Bandara", lat: -7.380, lng: 112.787 },
  { id: 5, name: "Hana Putri", location: "Raja Ampat, Papua Barat", status: "in-progress" as TravelStatus, service: "Wisata Laut", lat: -0.869, lng: 130.978 },
  { id: 6, name: "Dewi Lestari", location: "Candi Borobudur, Yogyakarta", status: "done" as TravelStatus, service: "City Tour", lat: -7.608, lng: 110.204 },
];

const mockInvoices = [
  {
    id: "INV-001", service: "Paket Umroh Premium — Nov 2026", amount: "Rp 28.500.000",
    date: "20 Jul 2026", status: "pending-payment" as InvStatus, points: 285,
    detail: "2 orang dewasa • Keberangkatan 10 Nov 2026 • Makkah & Madinah 12 hari",
  },
  {
    id: "INV-002", service: "Tiket CGK-DPS 10-15 Okt, 2 orang", amount: "Rp 2.700.000",
    date: "22 Jul 2026", status: "waiting-verification" as InvStatus, points: 27,
    detail: "Garuda GA-403 • Berangkat 06:30 WIB • Pulang DPS-CGK 18:45 WITA",
  },
];

const rewards = [
  { id: 1, name: "Upgrade Kamar Suite", desc: "Upgrade hotel ke Suite 1 malam di hotel partner", points: 1500, category: "Hotel", icon: Hotel },
  { id: 2, name: "Transportasi Bandara", desc: "Antar-jemput bandara gratis dengan kendaraan ber-AC", points: 500, category: "Transport", icon: Car },
  { id: 3, name: "Diskon Tiket 20%", desc: "Potongan 20% pembelian tiket pesawat rute domestik", points: 800, category: "Tiket", icon: Plane },
  { id: 4, name: "City Tour 1 Hari", desc: "Paket city tour lengkap dengan pemandu wisata profesional", points: 1200, category: "Wisata", icon: Globe },
  { id: 5, name: "Voucher Kuliner Rp500K", desc: "Voucher makan di 50+ restoran partner di seluruh Indonesia", points: 600, category: "Kuliner", icon: Coffee },
  { id: 6, name: "Fast Track Dokumen", desc: "Prioritas pengurusan visa & dokumen 2× lebih cepat", points: 300, category: "Dokumen", icon: FileText },
  { id: 7, name: "Diskon Umroh 10%", desc: "Diskon 10% dari harga paket Umroh reguler 1 orang", points: 3000, category: "Umroh", icon: Star },
  { id: 8, name: "Lounge Bandara 3×", desc: "Akses Premium Lounge di 8 bandara internasional", points: 1800, category: "Fasilitas", icon: Building },
];

const initMessages: ChatMessage[] = [
  { id: 1, sender: "admin", text: "Selamat datang di Ranata Tour! Saya Rina, siap membantu Anda. Ada yang bisa kami bantu hari ini?", time: "09:00" },
  { id: 2, sender: "customer", text: "Halo, saya ingin pesan tiket pesawat ke Bali tanggal 10-15 Oktober, 2 orang dewasa.", time: "09:02" },
  { id: 3, sender: "admin", text: "Baik Pak Ahmad! Apakah prefer penerbangan pagi atau malam? Dan keberangkatan dari kota mana?", time: "09:03" },
  { id: 4, sender: "customer", text: "Dari Jakarta, pagi hari. Budget sekitar Rp 1.5 juta per orang.", time: "09:05" },
  { id: 5, sender: "admin", text: "Saya temukan pilihan terbaik: Garuda GA-403 CGK-DPS 06:30 = Rp 1.350.000/orang. Total 2 orang Rp 2.700.000. Apakah saya buatkan invoicenya sekarang, Pak?", time: "09:08" },
];

const customerTransactions = [
  { id: "TRX-001", service: "Paket Umroh Premium", amount: "Rp 28.500.000", date: "20 Jul 2026", status: "pending" as TxStatus, points: "+285" },
  { id: "TRX-INV002", service: "Tiket CGK-DPS PP 2 orang", amount: "Rp 2.700.000", date: "22 Jul 2026", status: "pending" as TxStatus, points: "+27" },
  { id: "TRX-009", service: "Hotel Bali 3 Malam", amount: "Rp 3.600.000", date: "14 Mar 2026", status: "verified" as TxStatus, points: "+36" },
  { id: "TRX-012", service: "Tiket CGK-SUB PP", amount: "Rp 780.000", date: "02 Jan 2026", status: "verified" as TxStatus, points: "+8" },
];

// Trip timeline for status tracking (customer view)
const tripTimeline = [
  { id: 1, label: "Penjemputan Rumah ke Bandara Jakarta", officer: "Bapak Danu (0812-9999-1111)", status: "done" as TravelStatus, time: "10 Okt 2026 — 04:30 WIB" },
  { id: 2, label: "Handling Bandara CGK (Check-in & Boarding)", officer: "Bapak Bagus (0813-8888-2222)", status: "in-progress" as TravelStatus, time: "10 Okt 2026 — 06:00 WIB" },
  { id: 3, label: "Penerbangan CGK → DPS (GA-403)", officer: "Garuda Indonesia GA-403", status: "waiting" as TravelStatus, time: "10 Okt 2026 — 06:30 WIB" },
  { id: 4, label: "Penjemputan di Bandara Ngurah Rai Bali", officer: "Bapak Ketut (0819-7777-3333)", status: "waiting" as TravelStatus, time: "10 Okt 2026 — 09:45 WITA" },
  { id: 5, label: "Antar ke Hotel & Handling Check-in", officer: "Bapak Ketut (0819-7777-3333)", status: "waiting" as TravelStatus, time: "10 Okt 2026 — 10:30 WITA" },
];

const services = [
  { icon: Plane, label: "Tiket Pesawat", desc: "Domestik & internasional" },
  { icon: Hotel, label: "Hotel & Villa", desc: "1 – 5 bintang" },
  { icon: Car, label: "Sewa Transportasi", desc: "Mobil, bus, minibus" },
  { icon: FileText, label: "Pengurusan Dokumen", desc: "Visa, paspor, asuransi" },
  { icon: Star, label: "Paket Umroh", desc: "Regular & premium" },
  { icon: Globe, label: "Paket Wisata", desc: "Domestik & mancanegara" },
];

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function RanataLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
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
    <img
      src={ranaatLogo}
      alt="Ranata Tour & Travel"
      className={`${h} w-auto object-contain`}
      onError={() => setErr(true)}
    />
  );
}

function TierBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "md" }) {
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

function StatusPill({ status }: { status: TxStatus }) {
  const map = {
    pending: { label: "Menunggu", cls: "bg-yellow-100 text-yellow-800" },
    verified: { label: "Terverifikasi", cls: "bg-green-100 text-green-800" },
    rejected: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
  };
  const s = map[status];
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function TravelPin({ status }: { status: TravelStatus }) {
  const color = status === "waiting" ? "#EF4444" : status === "in-progress" ? "#F59E0B" : "#22C55E";
  return (
    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${status !== "done" ? "animate-pulse" : ""}`} style={{ background: color }} />
  );
}

// ─── LEAFLET FIX: default marker icons ─────────────────────────────────────────
// Fix Leaflet's broken default icon paths when bundled with Vite
(function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
})();

// Create custom colored circle marker icons
function createTravelerIcon(status: TravelStatus) {
  const color = status === "waiting" ? "#EF4444" : status === "in-progress" ? "#F59E0B" : "#22C55E";
  const pulse = status !== "done" ? `
    <div style="
      position:absolute; inset:-6px; border-radius:50%;
      background:${color}33;
      animation:leaflet-ping 1.4s ease-in-out infinite;
    "></div>` : "";
  const html = `
    <div style="position:relative; width:28px; height:28px;">
      ${pulse}
      <div style="
        width:28px; height:28px; border-radius:50%;
        background:${color};
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex; align-items:center; justify-content:center;
        position:relative; z-index:1;
      ">
        <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.9);"></div>
      </div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16] });
}

// Inner component to re-fly map when travelers change
function MapController({ travelers }: { travelers: typeof mockTravelers }) {
  const map = useMap();
  useEffect(() => {
    if (travelers.length === 0) return;
    const bounds = L.latLngBounds(travelers.map(t => [t.lat, t.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function IndonesiaMap({ travelers, onStatusChange }: { travelers: typeof mockTravelers; onStatusChange: (id: number, s: TravelStatus) => void }) {
  const statusLabel = (s: TravelStatus) => s === "waiting" ? "Menunggu" : s === "in-progress" ? "In-Progress" : "Selesai";
  const statusColor = (s: TravelStatus) => s === "waiting" ? "#EF4444" : s === "in-progress" ? "#F59E0B" : "#22C55E";
  const cycleStatus = (id: number, cur: TravelStatus) =>
    onStatusChange(id, cur === "waiting" ? "in-progress" : cur === "in-progress" ? "done" : "waiting");

  // Inject ping keyframe once
  useEffect(() => {
    const id = "leaflet-ping-style";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes leaflet-ping { 0%,100%{transform:scale(1);opacity:0.6;} 50%{transform:scale(1.8);opacity:0;} }`;
    document.head.appendChild(s);
  }, []);

  const center: [number, number] = [-2.5, 118.0]; // center of Indonesia

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height: 480 }}>
      {/* Overlay badges — above map (z-[1000] is Leaflet's own z, use 1001+) */}
      <div className="absolute top-3 left-14 bg-white/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm" style={{ zIndex: 1001 }}>
        <div className="text-[10px] text-muted-foreground">Perjalanan Aktif</div>
        <div className="text-2xl font-black leading-none mt-0.5" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>
          {travelers.filter(t => t.status !== "done").length}
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-sm" style={{ zIndex: 1001 }}>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[11px] font-bold text-green-700">LIVE</span>
      </div>
      <div className="absolute bottom-8 left-3 bg-white/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-sm" style={{ zIndex: 1001 }}>
        <div className="text-[9px] font-bold tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>STATUS</div>
        {(["waiting", "in-progress", "done"] as TravelStatus[]).map(s => (
          <div key={s} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(s) }} />
            <span className="text-[10px] text-muted-foreground">{statusLabel(s)}</span>
            <span className="ml-auto text-[10px] font-bold" style={{ color: statusColor(s) }}>{travelers.filter(t => t.status === s).length}</span>
          </div>
        ))}
        <div className="text-[9px] text-muted-foreground/50 mt-2 border-t border-border pt-1.5">Klik marker → ubah status</div>
      </div>

      <MapContainer
        center={center}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <>
          {/* Satellite-style tile layer from Esri */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {/* Labels on top of satellite */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            opacity={0.7}
          />

          <MapController travelers={travelers} />

          {travelers.map(t => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={createTravelerIcon(t.status)}
              eventHandlers={{ click: () => cycleStatus(t.id, t.status) }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: "Montserrat, sans-serif" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>{t.service}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{t.location}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor(t.status), flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 11, color: statusColor(t.status) }}>{statusLabel(t.status)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", borderTop: "1px solid #eee", paddingTop: 6 }}>📍 {t.lat.toFixed(3)}, {t.lng.toFixed(3)}</div>
                  <button
                    onClick={() => cycleStatus(t.id, t.status)}
                    style={{
                      marginTop: 8, width: "100%", padding: "5px 0", borderRadius: 8,
                      background: "#800000", color: "white", border: "none",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Ubah Status →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </>
      </MapContainer>
    </div>
  );
}

// ─── TIER DETAIL PAGE ─────────────────────────────────────────────────────────
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

function TierDetailPage({ tier, onBack, onOpenLogin }: {
  tier: "Silver" | "Gold" | "Platinum";
  onBack: () => void;
  onOpenLogin: (t: "login" | "register") => void;
}) {
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

// ─── HERO SLIDESHOW ────────────────────────────────────────────────────────────
const heroSlides = [
  { url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=800&fit=crop&auto=format", label: "Tegallalang, Bali" },
  { url: "https://images.unsplash.com/photo-1703769605307-395ace742240?w=1600&h=800&fit=crop&auto=format", label: "Raja Ampat, Papua Barat" },
  { url: "https://images.unsplash.com/photo-1680100628674-26233c804e19?w=1600&h=800&fit=crop&auto=format", label: "Borobudur, Yogyakarta" },
  { url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1600&h=800&fit=crop&auto=format", label: "Pura Ulun Danu, Bali" },
  { url: "https://images.unsplash.com/photo-1700591698351-f8131b0f5d3c?w=1600&h=800&fit=crop&auto=format", label: "Labuan Bajo, NTT" },
];

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

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────
function LandingPage({ onOpenLogin }: { onOpenLogin: (tab: "login" | "register") => void }) {
  const [subPage, setSubPage] = useState<null | "Silver" | "Gold" | "Platinum">(null);
  const [paketsOpen, setPaketsOpen] = useState(false);

  if (subPage) {
    return <TierDetailPage tier={subPage} onBack={() => setSubPage(null)} onOpenLogin={onOpenLogin} />;
  }

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
              {/* invisible bridge so gap between button and panel doesn't close the menu */}
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
                          onClick={() => { setSubPage(t); setPaketsOpen(false); }}
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

      {/* Hero — auto-sliding Indonesia destinations */}
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
              { name: "Silver" as Tier, price: "Rp 2.500.000", period: "/tahun", welcome: "500 poin", features: ["Sewa Transportasi ke Bandara", "Layanan 24/7 via Chat", "Poin setiap transaksi", "Akses dashboard member"] },
              { name: "Gold" as Tier, price: "Rp 5.000.000", period: "/tahun", welcome: "1.200 poin", features: ["Semua benefit Silver", "Handling di Bandara (check-in & boarding)", "Jemput di bandara tujuan", "Diskon 10% semua layanan"] },
              { name: "Platinum" as Tier, price: "Rp 10.000.000", period: "/tahun", welcome: "3.000 poin", features: ["Semua benefit Gold", "Penjemputan dari rumah", "Handling penuh bandara + hotel", "Check-in hotel diurus tim", "Personal consultant", "Diskon 15% semua layanan"] },
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
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
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

// ─── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage({ tab, onTabChange, onLogin, onBack }: {
  tab: "login" | "register";
  onTabChange: (t: "login" | "register") => void;
  onLogin: (role: "customer" | "admin") => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-screen flex" style={{ animation: "authPageIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex flex-col w-5/12 relative overflow-hidden" style={{ background: "linear-gradient(155deg, #800000 0%, #500000 55%, #2a0000 100%)" }}>
        <img
          src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=1100&fit=crop&auto=format"
          alt=""
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(218,165,32,0.25) 0%, transparent 55%)" }} />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative p-8">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors group">
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </button>
        </div>

        <div className="relative flex-1 flex flex-col justify-center px-10 pb-12">
          <RanataLogo size="lg" />
          <h2 className="text-3xl font-black text-white mt-7 mb-3 leading-tight" style={{ fontFamily: "Montserrat, sans-serif", animation: "fadeSlideUp 0.5s ease 0.15s both" }}>
            Selamat Datang di<br /><span style={{ color: "#DAA520" }}>Ranata Membership</span>
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-9" style={{ animation: "fadeSlideUp 0.5s ease 0.25s both" }}>
            Platform eksklusif perjalanan premium. Full handling dari depan rumah hingga kunci kamar hotel Anda.
          </p>

          {/* Tier preview cards */}
          <div className="space-y-3">
            {(["Silver", "Gold", "Platinum"] as const).map((t, i) => {
              const descs = ["Transportasi & layanan dasar", "Full handling bandara", "End-to-end premium"];
              const prices = ["2.500.000", "5.000.000", "10.000.000"];
              return (
                <div key={t} className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/10 backdrop-blur-sm"
                     style={{ background: "rgba(255,255,255,0.07)", animation: `fadeSlideUp 0.5s ease ${0.3 + i * 0.1}s both` }}>
                  <TierBadge tier={t} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold">{descs[i]}</div>
                  </div>
                  <div className="text-white/50 text-[11px] font-medium whitespace-nowrap">Rp {prices[i]}/th</div>
                </div>
              );
            })}
          </div>

          {/* Bottom trust badge */}
          <div className="mt-8 flex items-center gap-3 text-white/40 text-[11px]" style={{ animation: "fadeSlideUp 0.5s ease 0.6s both" }}>
            <Shield className="w-3.5 h-3.5" />
            <span>Terdaftar di Kemenparekraf RI • Data terenkripsi SSL</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
          </button>
          <RanataLogo size="sm" />
          <div className="w-16" />
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[420px]" style={{ animation: "slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>

            {/* Tab switcher */}
            <div className="flex rounded-2xl overflow-hidden border-2 border-border mb-8 p-1 bg-background">
              {(["login", "register"] as const).map(t => (
                <button key={t} onClick={() => onTabChange(t)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300"
                  style={tab === t
                    ? { background: "#800000", color: "#fff", fontFamily: "Montserrat, sans-serif", boxShadow: "0 4px 16px rgba(128,0,0,0.25)" }
                    : { color: "#6b6b6b", fontFamily: "Montserrat, sans-serif" }}>
                  {t === "login" ? "Masuk" : "Daftar Member"}
                </button>
              ))}
            </div>

            <div style={{ animation: "fadeSlideUp 0.4s ease 0.2s both" }}>
              <h1 className="text-2xl font-black mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {tab === "login" ? "Selamat Datang Kembali 👋" : "Buat Akun Member"}
              </h1>
              <p className="text-muted-foreground text-sm mb-7">
                {tab === "login"
                  ? "Masuk ke dashboard membership eksklusif Anda"
                  : "Bergabung dan nikmati layanan premium Ranata Tour"}
              </p>
            </div>

            {/* Google */}
            <button className="w-full flex items-center justify-center gap-3 border-2 border-border rounded-2xl py-3.5 text-sm font-semibold hover:border-primary hover:bg-secondary/30 transition-all mb-5 group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjutkan dengan Google
            </button>

            <div className="flex items-center gap-3 mb-5 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> atau <div className="flex-1 h-px bg-border" />
            </div>

            {/* Fields */}
            <div style={{ animation: "fadeSlideUp 0.4s ease 0.3s both" }}>
              {tab === "register" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Nama Lengkap</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ahmad Fauzi"
                    className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40" />
                </div>
              )}
              {tab === "register" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5 text-foreground">Nomor WhatsApp</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08123456789" type="tel"
                    className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40" />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5 text-foreground">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@contoh.com"
                  className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40" />
              </div>
              <div className="mb-7 relative">
                <label className="block text-xs font-semibold mb-1.5 text-foreground">Password</label>
                <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? "text" : "password"} placeholder="••••••••"
                  className="w-full border-2 border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all hover:border-primary/40 pr-12" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-9 text-muted-foreground hover:text-primary transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button onClick={() => onLogin("customer")}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm mb-3 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #800000 0%, #5a0000 100%)", fontFamily: "Montserrat, sans-serif", boxShadow: "0 8px 32px rgba(128,0,0,0.28)" }}>
              {tab === "login" ? "Masuk ke Akun" : "Buat Akun Member"}
            </button>
            <button onClick={() => onLogin("admin")}
              className="w-full py-3.5 rounded-2xl text-primary font-semibold text-xs bg-secondary hover:bg-secondary/70 transition-colors border border-border">
              Masuk sebagai Admin / Staff
            </button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {tab === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
              <button onClick={() => onTabChange(tab === "login" ? "register" : "login")} className="text-primary font-semibold hover:underline">
                {tab === "login" ? "Daftar Member" : "Masuk"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER HEADER ───────────────────────────────────────────────────────────
function CustomerHeader({ setTab, onLogout, pendingInvoices }: {
  setTab: (t: CustomerTab) => void; onLogout: () => void; pendingInvoices: number;
}) {
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        {/* Logo — klik kembali ke dashboard */}
        <button onClick={() => setTab("dashboard")} className="flex-shrink-0">
          <RanataLogo size="sm" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right section: notif + profile */}
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
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                  style={{ background: "#800000" }}
                >
                  {pendingInvoices}
                </span>
              )}
            </button>

            {/* Dropdown — opens BELOW the header, never clipped */}
            {showNotif && (
              <div
                className="absolute right-0 w-80 bg-white rounded-2xl shadow-2xl border border-border"
                style={{ top: "calc(100% + 8px)", zIndex: 9999 }}
              >
                {/* Arrow pointer */}
                <div
                  className="absolute right-3 bg-white border-l border-t border-border rotate-45"
                  style={{ top: -7, width: 13, height: 13 }}
                />
                <div className="relative p-4 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Notifikasi</span>
                  <button
                    onClick={() => setShowNotif(false)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
                {[
                  {
                    title: "Invoice Baru Dari Admin",
                    desc: "Tagihan Tiket CGK-DPS Rp 2.700.000 siap dibayar",
                    time: "5 menit lalu",
                    dot: "#EF4444",
                    action: () => { setTab("tagihan"); setShowNotif(false); },
                  },
                  {
                    title: "Pembayaran Diverifikasi",
                    desc: "Transaksi TRX-009 telah dikonfirmasi admin",
                    time: "2 jam lalu",
                    dot: "#22C55E",
                    action: () => setShowNotif(false),
                  },
                  {
                    title: "Poin Ditambahkan",
                    desc: "+36 poin dari Hotel Bali 3 Malam",
                    time: "2 jam lalu",
                    dot: "#DAA520",
                    action: () => setShowNotif(false),
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    onClick={n.action}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-background cursor-pointer border-b border-border last:border-0 transition-colors"
                  >
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{n.time}</div>
                    </div>
                  </div>
                ))}
                <div className="p-3 border-t border-border">
                  <button
                    onClick={() => setShowNotif(false)}
                    className="w-full text-center text-xs font-semibold py-2 rounded-lg hover:bg-secondary transition-colors"
                    style={{ color: "#800000" }}
                  >
                    Lihat Semua Notifikasi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile chip */}
          <div className="flex items-center gap-2 bg-background rounded-xl px-2.5 py-1.5 border border-border">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: "#800000" }}
            >
              AF
            </div>
            <div className="hidden md:block">
              <div className="text-[11px] font-semibold leading-none mb-0.5">Ahmad Fauzi</div>
              <TierBadge tier="Platinum" />
            </div>
            <button
              onClick={onLogout}
              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── CUSTOMER DASHBOARD ─────────────────────────────────────────────────────────
function CustomerDashboard({ setTab }: { setTab: (t: CustomerTab) => void }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Membership Card */}
      <div className="relative rounded-3xl overflow-hidden p-8 mb-8 text-white" style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 60%, #2a0000 100%)", minHeight: 180 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(218,165,32,0.4) 0%, transparent 60%)" }} />
        <div className="relative grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <TierBadge tier="Platinum" size="md" />
              <span className="text-white/50 text-xs">Member Aktif</span>
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Ahmad Fauzi</h2>
            <div className="flex items-center gap-2 text-white/70 text-sm mb-4"><Hash className="w-3.5 h-3.5" /><span>RT-2024-001</span></div>
            <div className="flex items-center gap-6 flex-wrap">
              <div><div className="text-white/60 text-xs mb-1">Total Poin</div><div className="text-3xl font-black" style={{ fontFamily: "Montserrat, sans-serif", color: "#DAA520" }}>12.450</div></div>
              <div className="h-10 w-px bg-white/20" />
              <div><div className="text-white/60 text-xs mb-1">Bergabung</div><div className="text-sm font-semibold">Januari 2022</div></div>
              <div className="h-10 w-px bg-white/20" />
              <div><div className="text-white/60 text-xs mb-1">Transaksi</div><div className="text-sm font-semibold">24 Layanan</div></div>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="text-right"><div className="text-white/60 text-xs mb-1">Poin kadaluarsa</div><div className="text-sm font-semibold text-yellow-300">31 Des 2026</div></div>
            <button onClick={() => setTab("perjalanan")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105" style={{ background: "#DAA520", color: "#2a1800", fontFamily: "Montserrat, sans-serif" }}>
              <Navigation className="w-3.5 h-3.5" /> Lihat Status Perjalanan
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { icon: MessageCircle, label: "Request Layanan", tab: "layanan" as CustomerTab },
          { icon: CreditCard, label: "Tagihan & Bayar", tab: "tagihan" as CustomerTab, badge: 1 },
          { icon: Navigation, label: "Status Perjalanan", tab: "perjalanan" as CustomerTab },
          { icon: Gift, label: "Tukar Poin", tab: "redeem" as CustomerTab },
          { icon: History, label: "Riwayat", tab: "riwayat" as CustomerTab },
          { icon: User, label: "Profil Saya", tab: "profil" as CustomerTab },
        ].map(a => (
          <button key={a.label} onClick={() => setTab(a.tab)} className="relative bg-white rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all group text-center">
            {"badge" in a && a.badge! > 0 && <span className="absolute top-2 right-2 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: "#EF4444" }}>{a.badge}</span>}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform" style={{ background: "rgba(128,0,0,0.08)" }}>
              <a.icon className="w-5 h-5" style={{ color: "#800000" }} />
            </div>
            <div className="font-bold text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* Invoice Alert + Recent */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-sm text-yellow-800" style={{ fontFamily: "Montserrat, sans-serif" }}>Tagihan Menunggu Pembayaran</h3>
          </div>
          <div className="bg-white rounded-xl p-4 border border-yellow-200 mb-3">
            <div className="text-xs font-semibold mb-1">Tiket CGK-DPS 10-15 Okt, 2 orang</div>
            <div className="text-xl font-black" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>Rp 2.700.000</div>
            <div className="text-xs text-muted-foreground mt-1">Invoice #INV-002 • Dikirim 22 Jul 2026</div>
          </div>
          <button onClick={() => setTab("tagihan")} className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "#800000" }}>
            Bayar Sekarang
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Transaksi Terbaru</h3>
            <button onClick={() => setTab("riwayat")} className="text-xs font-semibold hover:underline" style={{ color: "#800000" }}>Lihat Semua</button>
          </div>
          <div className="divide-y divide-border">
            {customerTransactions.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-background transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(128,0,0,0.08)" }}><Plane className="w-4 h-4" style={{ color: "#800000" }} /></div>
                <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{t.service}</div><div className="text-[10px] text-muted-foreground">{t.date}</div></div>
                <div className="text-right flex-shrink-0"><div className="text-xs font-bold">{t.amount}</div><StatusPill status={t.status} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER LAYANAN (CHAT) ────────────────────────────────────────────────────
function CustomerLayanan() {
  const [messages, setMessages] = useState<ChatMessage[]>(initMessages);
  const [input, setInput] = useState("");
  const [selectedSvc, setSelectedSvc] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { id: Date.now(), sender: "customer", text: input, time: now }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: "admin",
        text: "Terima kasih! Tim kami akan segera memproses permintaan Anda. Mohon tunggu konfirmasi. Jika sudah disetujui, invoice akan dikirim ke notifikasi Anda.",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      }]);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6" style={{ height: "calc(100vh - 80px)" }}>
      <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Pilih Layanan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Request via chat ke admin</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {services.map(s => (
            <button key={s.label} onClick={() => {
              setSelectedSvc(s.label);
              const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
              setMessages(prev => [...prev, { id: Date.now(), sender: "customer", text: `Saya ingin request layanan: ${s.label}`, time: now }]);
            }} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all border ${selectedSvc === s.label ? "border-primary bg-secondary" : "border-transparent hover:bg-background"}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(128,0,0,0.08)" }}>
                <s.icon className="w-4 h-4" style={{ color: "#800000" }} />
              </div>
              <div><div className="text-xs font-semibold">{s.label}</div><div className="text-[10px] text-muted-foreground">{s.desc}</div></div>
              {selectedSvc === s.label && <Check className="w-4 h-4 ml-auto" style={{ color: "#800000" }} />}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Admin Rina sedang online
          </div>
        </div>
      </div>
      <div className="md:col-span-2 bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#800000" }}>R</div>
          <div><div className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Admin Ranata Tour</div><div className="flex items-center gap-1.5 text-xs text-green-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500" />Online</div></div>
          <div className="ml-auto text-xs text-muted-foreground bg-background rounded-lg px-3 py-1.5 border border-border"><span className="font-semibold">RT-2024-001</span> • Tier Platinum</div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/50">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"}`}>
              {m.sender === "admin" && <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto flex-shrink-0" style={{ background: "#800000" }}>R</div>}
              <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.sender === "customer" ? "text-white rounded-br-md" : "bg-white text-foreground rounded-bl-md border border-border"}`} style={m.sender === "customer" ? { background: "#800000" } : {}}>
                <p className="leading-relaxed">{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.sender === "customer" ? "text-white/60 text-right" : "text-muted-foreground"}`}>{m.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t border-border bg-white">
          <div className="flex items-end gap-3">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Contoh: Saya ingin tiket ke Bali, 10-15 Okt, 2 orang dewasa..." className="flex-1 border border-border rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-primary transition-colors" rows={2} />
            <button onClick={send} className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:opacity-80 transition-opacity flex-shrink-0" style={{ background: "#800000" }}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER TAGIHAN & BAYAR ───────────────────────────────────────────────────
function CustomerTagihan() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [selected, setSelected] = useState<string | null>(null);
  const [payStep, setPayStep] = useState<"choose" | "va" | "qris" | "upload" | null>(null);
  const [payMethod, setPayMethod] = useState<"va" | "qris" | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const selectedInv = invoices.find(i => i.id === selected);

  const handlePay = () => {
    if (!selected) return;
    setInvoices(prev => prev.map(i => i.id === selected ? { ...i, status: "waiting-verification" as InvStatus } : i));
    setPayStep(null);
    setSelected(null);
  };

  const invStatusMap = {
    "pending-payment": { label: "Belum Dibayar", cls: "bg-red-100 text-red-700" },
    "waiting-verification": { label: "Menunggu Verifikasi", cls: "bg-yellow-100 text-yellow-700" },
    "verified": { label: "Terverifikasi", cls: "bg-green-100 text-green-700" },
    "rejected": { label: "Ditolak", cls: "bg-gray-100 text-gray-500" },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Tagihan & Pembayaran</h1>
        <p className="text-muted-foreground text-sm mt-1">Invoice dari admin yang perlu Anda bayar</p>
      </div>

      <div className="space-y-4">
        {invoices.map(inv => {
          const s = invStatusMap[inv.status];
          return (
            <div key={inv.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{inv.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{inv.service}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{inv.detail}</p>
                  <div className="flex items-center gap-4">
                    <div><div className="text-xs text-muted-foreground">Total Tagihan</div><div className="text-xl font-black" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>{inv.amount}</div></div>
                    <div><div className="text-xs text-muted-foreground">Poin didapat</div><div className="text-sm font-bold" style={{ color: "#DAA520" }}>+{inv.points} poin</div></div>
                    <div><div className="text-xs text-muted-foreground">Tanggal Invoice</div><div className="text-xs font-semibold">{inv.date}</div></div>
                  </div>
                </div>
                {inv.status === "pending-payment" && (
                  <button onClick={() => { setSelected(inv.id); setPayStep("choose"); }} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap" style={{ background: "#800000" }}>
                    Bayar Sekarang
                  </button>
                )}
                {inv.status === "waiting-verification" && (
                  <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded-xl px-3 py-2">
                    <Clock className="w-4 h-4" />
                    <span>Menunggu konfirmasi admin</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {payStep && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border" style={{ background: "linear-gradient(135deg, #800000, #600000)" }}>
              <div className="flex justify-between items-center">
                <div className="text-white font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Pembayaran Invoice</div>
                <button onClick={() => { setPayStep(null); setPayMethod(null); }} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-background rounded-xl p-4 mb-5 border border-border">
                <div className="text-xs text-muted-foreground mb-1">{selectedInv.service}</div>
                <div className="text-2xl font-black" style={{ color: "#800000", fontFamily: "Montserrat, sans-serif" }}>{selectedInv.amount}</div>
                <div className="text-xs text-muted-foreground mt-1">Invoice {selectedInv.id}</div>
              </div>

              {payStep === "choose" && (
                <>
                  <div className="text-xs font-bold mb-3 text-muted-foreground">Pilih Metode Pembayaran</div>
                  <div className="space-y-3">
                    <button onClick={() => { setPayMethod("va"); setPayStep("va"); }} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(128,0,0,0.08)" }}><CreditCard className="w-5 h-5" style={{ color: "#800000" }} /></div>
                      <div className="text-left"><div className="text-sm font-bold">Virtual Account</div><div className="text-xs text-muted-foreground">BCA • Mandiri • BNI • BRI</div></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                    <button onClick={() => { setPayMethod("qris"); setPayStep("qris"); }} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(128,0,0,0.08)" }}><QrCode className="w-5 h-5" style={{ color: "#800000" }} /></div>
                      <div className="text-left"><div className="text-sm font-bold">QRIS</div><div className="text-xs text-muted-foreground">Scan QR dari semua e-wallet</div></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  </div>
                </>
              )}

              {payStep === "va" && (
                <>
                  <div className="text-xs font-bold mb-3 text-muted-foreground">Pilih Bank</div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[["BCA", "1234567890"], ["Mandiri", "0987654321"], ["BNI", "1122334455"], ["BRI", "5544332211"]].map(([bank, no]) => (
                      <div key={bank} className="border border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary transition-colors">
                        <div className="font-bold text-sm">{bank}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{no}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-4">
                    Transfer tepat sesuai nominal. Kelebihan transfer tidak dapat dikembalikan.
                  </div>
                  <button onClick={() => setPayStep("upload")} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: "#800000" }}>
                    Sudah Transfer → Upload Bukti
                  </button>
                </>
              )}

              {payStep === "qris" && (
                <>
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-border mb-3">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                        <div className="text-xs text-muted-foreground">QR Code QRIS</div>
                        <div className="text-xs font-bold" style={{ color: "#800000" }}>Ranata Tour</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">Scan menggunakan GoPay, OVO, DANA, ShopeePay, atau aplikasi bank Anda</div>
                  </div>
                  <button onClick={() => setPayStep("upload")} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: "#800000" }}>
                    Sudah Bayar → Upload Bukti
                  </button>
                </>
              )}

              {payStep === "upload" && (
                <>
                  <div className="text-xs font-bold mb-3 text-muted-foreground">Upload Bukti Pembayaran</div>
                  <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-secondary transition-colors mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-semibold text-muted-foreground">{fileName || "Klik untuk upload screenshot"}</span>
                    <span className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF — Maks 5MB</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFileName(e.target.files?.[0]?.name || "")} />
                  </label>
                  <button onClick={handlePay} className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90" style={{ background: "#800000" }}>
                    Kirim Bukti Pembayaran
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STATUS PERJALANAN (CUSTOMER) ──────────────────────────────────────────────
function CustomerPerjalanan() {
  const [timeline, setTimeline] = useState(tripTimeline);
  const statusColor = { waiting: "#EF4444", "in-progress": "#F59E0B", done: "#22C55E" };
  const statusLabel = { waiting: "Menunggu", "in-progress": "Sedang Berlangsung", done: "Selesai" };

  const overallStatus = timeline.some(t => t.status === "in-progress") ? "in-progress" : timeline.every(t => t.status === "done") ? "done" : "waiting";
  const overallColor = statusColor[overallStatus];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Status Banner */}
      <div className="rounded-2xl p-6 mb-8 text-white" style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 100%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/70 text-xs mb-1">Status Perjalanan Anda</div>
            <h2 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Tiket CGK → DPS • 10 Okt 2026</h2>
            <p className="text-white/70 text-sm mt-1">Garuda Indonesia GA-403 • 2 Penumpang</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: overallColor }} />
              <span className="font-bold text-sm" style={{ color: overallColor }}>{statusLabel[overallStatus]}</span>
            </div>
            <div className="text-white/60 text-xs">Terakhir update: 09:15 WIB</div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-2xl border border-border">
        <span className="text-xs font-bold text-muted-foreground">Status Pin:</span>
        {[{ color: "#EF4444", label: "Merah = Menunggu Dijemput" }, { color: "#F59E0B", label: "Kuning = In-Progress / Sedang Dijemput" }, { color: "#22C55E", label: "Hijau = Selesai" }].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Timeline Perjalanan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Pantau setiap tahap perjalanan Anda secara real-time</p>
        </div>
        <div className="p-5">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-border" />
            <div className="space-y-6">
              {timeline.map((step, i) => {
                const color = statusColor[step.status];
                const isActive = step.status === "in-progress";
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center ${isActive ? "animate-pulse" : ""}`} style={{ background: color }}>
                        {step.status === "done" ? <Check className="w-4 h-4 text-white" /> : step.status === "in-progress" ? <Navigation className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className={`flex-1 bg-background rounded-xl p-4 border ${isActive ? "border-yellow-300 bg-yellow-50/30" : "border-border"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>{step.label}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <User className="w-3 h-3" />
                            <span>{step.officer}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{step.time}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: color }}>
                          {statusLabel[step.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-5 bg-background border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" style={{ color: "#800000" }} />
            <span>Tim lapangan Ranata Tour memperbarui status secara real-time. Notifikasi akan dikirim ke akun Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER REDEEM ───────────────────────────────────────────────────────────
function CustomerRedeem() {
  const [redeemed, setRedeemed] = useState<number[]>([]);
  const [filter, setFilter] = useState("Semua");
  const pts = 12450;
  const categories = ["Semua", "Hotel", "Transport", "Tiket", "Wisata", "Kuliner", "Dokumen"];
  const filtered = filter === "Semua" ? rewards : rewards.filter(r => r.category === filter);
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="rounded-2xl p-6 mb-8 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #800000 0%, #4a0000 100%)" }}>
        <div><div className="text-white/70 text-sm mb-1">Poin Tersedia</div><div className="text-4xl font-black" style={{ fontFamily: "Montserrat, sans-serif", color: "#DAA520" }}>{pts.toLocaleString("id-ID")}</div><div className="text-white/60 text-xs mt-1">Berlaku hingga 31 Desember 2026</div></div>
        <div className="text-right"><div className="text-white/70 text-xs mb-2">Status Tier</div><TierBadge tier="Platinum" size="md" /><div className="text-white/60 text-xs mt-2">Bonus: 2× Poin tiap transaksi</div></div>
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${filter === c ? "text-white border-transparent" : "text-muted-foreground border-border bg-white hover:border-primary/30"}`} style={filter === c ? { background: "#800000" } : {}}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map(r => {
          const isRedeemed = redeemed.includes(r.id);
          const canAfford = pts >= r.points;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: "rgba(128,0,0,0.08)" }}><r.icon className="w-6 h-6" style={{ color: "#800000" }} /></div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-background text-muted-foreground border border-border">{r.category}</span>
                </div>
                <h4 className="font-bold text-sm mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>{r.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{r.desc}</p>
                <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" style={{ color: "#DAA520" }} /><span className="font-black text-sm" style={{ color: "#DAA520", fontFamily: "Montserrat, sans-serif" }}>{r.points.toLocaleString("id-ID")}</span><span className="text-xs text-muted-foreground">poin</span></div>
              </div>
              <div className="px-5 pb-5">
                <button onClick={() => canAfford && !isRedeemed && setRedeemed(prev => [...prev, r.id])} disabled={!canAfford || isRedeemed} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${isRedeemed ? "bg-green-100 text-green-700 cursor-default" : canAfford ? "text-white hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`} style={!isRedeemed && canAfford ? { background: "#800000" } : {}}>
                  {isRedeemed ? "✓ Berhasil Ditukar" : canAfford ? "Tukarkan Sekarang" : "Poin Tidak Cukup"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CUSTOMER RIWAYAT ──────────────────────────────────────────────────────────
function CustomerRiwayat() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div><h2 className="font-bold" style={{ fontFamily: "Montserrat, sans-serif" }}>Riwayat Transaksi</h2><p className="text-muted-foreground text-xs mt-0.5">Semua transaksi layanan Ranata Tour Anda</p></div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background transition-colors"><Filter className="w-3.5 h-3.5" /> Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>
              {["ID Transaksi", "Layanan", "Jumlah", "Tanggal", "Status", "Poin"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {customerTransactions.map(t => (
                <tr key={t.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{t.id}</td>
                  <td className="px-5 py-4 text-xs font-semibold">{t.service}</td>
                  <td className="px-5 py-4 text-xs font-bold">{t.amount}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{t.date}</td>
                  <td className="px-5 py-4"><StatusPill status={t.status} /></td>
                  <td className="px-5 py-4 text-xs font-bold" style={{ color: "#DAA520" }}>{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER PROFIL ───────────────────────────────────────────────────────────
function CustomerProfil({ onBack }: { onBack: () => void }) {
  // Bio data state (email tidak bisa diubah)
  const [bio, setBio] = useState({
    name: "Ahmad Fauzi",
    email: "ahmad.fauzi@email.com",   // readonly
    phone: "0812-3456-7890",
    address: "Jl. Melati No. 12, Komplek Griya Indah",
    city: "Jakarta Selatan",
    birthdate: "1990-05-15",
    memberId: "RT-2024-001",           // readonly
  });

  // Password change state
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });

  // UI state
  const [bioEditing, setBioEditing] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);

  const saveBio = () => {
    setBioEditing(false);
    setBioSaved(true);
    setTimeout(() => setBioSaved(false), 3000);
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

  const Field = ({
    label, value, field, type = "text", readOnly = false, placeholder = ""
  }: {
    label: string; value: string; field: keyof typeof bio;
    type?: string; readOnly?: boolean; placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          readOnly={readOnly || !bioEditing}
          placeholder={placeholder}
          onChange={e => !readOnly && setBio(b => ({ ...b, [field]: e.target.value }))}
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

  const PwdField = ({ label, fieldKey }: { label: string; fieldKey: keyof typeof pwd }) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPwd[fieldKey] ? "text" : "password"}
          value={pwd[fieldKey]}
          placeholder="••••••••"
          onChange={e => setPwd(p => ({ ...p, [fieldKey]: e.target.value }))}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPwd(s => ({ ...s, [fieldKey]: !s[fieldKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
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
        <div className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 border-2 border-white/30">
          <User className="w-10 h-10 text-white/80" />
        </div>
        <div className="relative">
          <TierBadge tier="Platinum" size="md" />
          <h1 className="text-2xl font-black mt-2 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{bio.name}</h1>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Hash className="w-3.5 h-3.5" />
            <span>{bio.memberId}</span>
          </div>
        </div>
      </div>

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
                onClick={() => setBioEditing(false)}
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
          <Field label="Nama Lengkap" value={bio.name} field="name" placeholder="Nama lengkap Anda" />
          <Field label="Email (tidak dapat diubah)" value={bio.email} field="email" type="email" readOnly />
          <Field label="Nomor HP / WhatsApp" value={bio.phone} field="phone" placeholder="08xx-xxxx-xxxx" />
          <Field label="Tanggal Lahir" value={bio.birthdate} field="birthdate" type="date" />
          <Field label="Kota Domisili" value={bio.city} field="city" placeholder="Kota Anda" />
          <Field label="Nomor Member (tidak dapat diubah)" value={bio.memberId} field="memberId" readOnly />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Alamat</label>
            <textarea
              value={bio.address}
              readOnly={!bioEditing}
              rows={2}
              onChange={e => setBio(b => ({ ...b, address: e.target.value }))}
              placeholder="Alamat lengkap"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none resize-none ${
                bioEditing
                  ? "bg-white border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  : "bg-background border-border"
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
          <PwdField label="Password Saat Ini" fieldKey="current" />
          <PwdField label="Password Baru" fieldKey="newPwd" />
          <PwdField label="Konfirmasi Password Baru" fieldKey="confirm" />
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

// ─── CUSTOMER APP ──────────────────────────────────────────────────────────────
function CustomerApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<CustomerTab>("dashboard");
  const pendingInv = mockInvoices.filter(i => i.status === "pending-payment").length;
  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader setTab={setTab} onLogout={onLogout} pendingInvoices={pendingInv} />
      {tab === "dashboard" && <CustomerDashboard setTab={setTab} />}
      {tab === "layanan" && <CustomerLayanan />}
      {tab === "tagihan" && <CustomerTagihan />}
      {tab === "perjalanan" && <CustomerPerjalanan />}
      {tab === "redeem" && <CustomerRedeem />}
      {tab === "riwayat" && <CustomerRiwayat />}
      {tab === "profil" && <CustomerProfil onBack={() => setTab("dashboard")} />}
    </div>
  );
}

// ─── ADMIN OVERVIEW ────────────────────────────────────────────────────────────
function AdminOverview({ setTab }: { setTab: (t: AdminTab) => void }) {
  const stats = [
    { label: "Total Member", value: "847", change: "+12 bulan ini", icon: Users, color: "#800000" },
    { label: "Perjalanan Aktif", value: "12", change: "4 menunggu jemput", icon: MapPin, color: "#F59E0B" },
    { label: "Verifikasi Tertunda", value: "3", change: "Perlu tindakan", icon: AlertCircle, color: "#EF4444" },
    { label: "Pendapatan Juli", value: "Rp 485 Jt", change: "+18% vs bulan lalu", icon: TrendingUp, color: "#22C55E" },
  ];
  return (
    <div className="p-8">
      <div className="mb-7"><h1 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Beranda Admin</h1><p className="text-muted-foreground text-sm mt-1">Rabu, 23 Juli 2026 • Dashboard Operasional Ranata Tour</p></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${s.color}15` }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
            <div className="text-2xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{s.value}</div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">{s.label}</div>
            <div className="text-[10px] text-muted-foreground">{s.change}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Transaksi Perlu Verifikasi</h3><button onClick={() => setTab("transactions")} className="text-xs font-semibold hover:underline" style={{ color: "#800000" }}>Lihat Semua</button></div>
          <table className="w-full">
            <thead><tr className="border-b border-border">{["Member", "Layanan", "Jumlah", "Status"].map(h => <th key={h} className="text-left pb-3 text-[11px] text-muted-foreground font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {mockTransactions.slice(0, 4).map(t => (
                <tr key={t.id} className="hover:bg-background/60">
                  <td className="py-3 text-xs font-semibold">{t.member}</td>
                  <td className="py-3 text-xs text-muted-foreground">{t.service}</td>
                  <td className="py-3 text-xs font-bold">{t.amount}</td>
                  <td className="py-3"><StatusPill status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Status Perjalanan Live</h3>
          <div className="space-y-3">
            {mockTravelers.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors cursor-pointer" onClick={() => setTab("map")}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.status === "waiting" ? "#EF4444" : t.status === "in-progress" ? "#F59E0B" : "#22C55E" }} />
                <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{t.name}</div><div className="text-[10px] text-muted-foreground truncate">{t.location}</div></div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
          <button onClick={() => setTab("map")} className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "#800000" }}>Buka Peta Monitoring</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN MAP ─────────────────────────────────────────────────────────────────
function AdminMap() {
  const [travelers, setTravelers] = useState(mockTravelers);
  const cycleStatus = (id: number) => {
    setTravelers(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next: TravelStatus = t.status === "waiting" ? "in-progress" : t.status === "in-progress" ? "done" : "waiting";
      return { ...t, status: next };
    }));
  };
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Pemantauan Posisi Live</h1><p className="text-muted-foreground text-sm mt-0.5">Real-time tracking pelanggan yang sedang dalam perjalanan</p></div>
        <button onClick={() => setTravelers([...mockTravelers])} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2"><IndonesiaMap travelers={travelers} onStatusChange={cycleStatus} /></div>
        <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border"><h3 className="font-bold text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Perjalanan Aktif</h3><p className="text-[11px] text-muted-foreground mt-0.5">Klik warna status untuk update</p></div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {travelers.map(t => {
              const color = t.status === "waiting" ? "#EF4444" : t.status === "in-progress" ? "#F59E0B" : "#22C55E";
              const label = t.status === "waiting" ? "Menunggu" : t.status === "in-progress" ? "In-Progress" : "Selesai";
              return (
                <div key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0"><div className="text-xs font-bold truncate">{t.name}</div><div className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.location}</div><div className="text-[10px] text-muted-foreground truncate">{t.service}</div></div>
                    <button onClick={() => cycleStatus(t.id)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white hover:scale-105 transition-all flex-shrink-0" style={{ background: color }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />{label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border bg-background">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Total: {travelers.length}</span><span className="font-semibold" style={{ color: "#800000" }}>Aktif: {travelers.filter(t => t.status !== "done").length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN MEMBERS ─────────────────────────────────────────────────────────────
function AdminMembers() {
  const [search, setSearch] = useState("");
  const filtered = mockMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search));
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Manajemen Member</h1><p className="text-muted-foreground text-sm mt-0.5">{mockMembers.length} total member</p></div></div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau ID member..." className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>{["ID Member", "Nama", "Tier", "Poin", "Bergabung", "Status", "No. Telepon", "Aksi"].map(h => <th key={h} className="text-left px-5 py-3 text-[11px] text-muted-foreground font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{m.id}</td>
                  <td className="px-5 py-4 text-xs font-semibold">{m.name}</td>
                  <td className="px-5 py-4"><TierBadge tier={m.tier} /></td>
                  <td className="px-5 py-4 text-xs font-bold" style={{ color: "#DAA520" }}>{m.points.toLocaleString("id-ID")}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{m.joined}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${m.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{m.status}</span></td>
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{m.phone}</td>
                  <td className="px-5 py-4"><button className="text-xs font-semibold hover:underline" style={{ color: "#800000" }}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN TRANSACTIONS ────────────────────────────────────────────────────────
function AdminTransactions() {
  const [txs, setTxs] = useState(mockTransactions);
  const verify = (id: string, status: TxStatus) => setTxs(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Verifikasi Pembayaran</h1><p className="text-muted-foreground text-sm mt-0.5">{txs.filter(t => t.status === "pending").length} transaksi menunggu verifikasi</p></div>
        {txs.filter(t => t.status === "pending").length > 0 && (
          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2"><AlertCircle className="w-4 h-4" />{txs.filter(t => t.status === "pending").length} perlu tindakan segera</div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background"><tr>{["ID", "Member", "Layanan", "Jumlah", "Poin", "Tanggal", "Bukti", "Status", "Aksi"].map(h => <th key={h} className="text-left px-5 py-3 text-[11px] text-muted-foreground font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {txs.map(t => (
                <tr key={t.id} className={`hover:bg-background/60 transition-colors ${t.status === "pending" ? "bg-yellow-50/30" : ""}`}>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{t.id}</td>
                  <td className="px-5 py-4 text-xs font-semibold whitespace-nowrap">{t.member}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground max-w-36 truncate">{t.service}</td>
                  <td className="px-5 py-4 text-xs font-bold whitespace-nowrap">{t.amount}</td>
                  <td className="px-5 py-4 text-xs font-bold whitespace-nowrap" style={{ color: "#DAA520" }}>+{t.points}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{t.date}</td>
                  <td className="px-5 py-4"><button className="flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: "#800000" }}><Eye className="w-3.5 h-3.5" /> Lihat</button></td>
                  <td className="px-5 py-4"><StatusPill status={t.status} /></td>
                  <td className="px-5 py-4">
                    {t.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => verify(t.id, "verified")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 transition-colors whitespace-nowrap"><CheckCircle className="w-3 h-3" /> Terima</button>
                        <button onClick={() => verify(t.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors"><XCircle className="w-3 h-3" /> Tolak</button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">Selesai</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN APP SHELL ───────────────────────────────────────────────────────────
function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const nav = [
    { key: "overview" as AdminTab, label: "Beranda Admin", icon: LayoutDashboard },
    { key: "map" as AdminTab, label: "Pemantauan Posisi", icon: Map },
    { key: "members" as AdminTab, label: "Manajemen Member", icon: Users },
    { key: "transactions" as AdminTab, label: "Verifikasi Pembayaran", icon: CreditCard },
    { key: "points" as AdminTab, label: "Laporan Poin", icon: Award },
    { key: "settings" as AdminTab, label: "Pengaturan Sistem", icon: Settings },
  ];
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 flex-shrink-0 flex flex-col min-h-screen sticky top-0 h-screen overflow-y-auto" style={{ background: "linear-gradient(180deg, #800000 0%, #500000 100%)" }}>
        <div className="p-4 border-b border-white/10">
          <RanataLogo size="sm" />
          <div className="mt-3 px-2 py-1 rounded-lg bg-white/10 text-white/70 text-[9px] font-medium text-center tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>ADMIN PANEL</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${tab === n.key ? "bg-white/20 text-white font-semibold" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <n.icon className="w-4 h-4 flex-shrink-0" />
              <span>{n.label}</span>
              {n.key === "transactions" && mockTransactions.filter(t => t.status === "pending").length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#EF4444" }}>{mockTransactions.filter(t => t.status === "pending").length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>A</div>
            <div><div className="text-white text-xs font-semibold">Admin Ranata</div><div className="text-white/50 text-[10px]">Super Administrator</div></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors"><LogOut className="w-3.5 h-3.5" /> Keluar</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {tab === "overview" && <AdminOverview setTab={setTab} />}
        {tab === "map" && <AdminMap />}
        {tab === "members" && <AdminMembers />}
        {tab === "transactions" && <AdminTransactions />}
        {tab === "points" && (
          <div className="p-8">
            <h1 className="text-xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Laporan Poin</h1>
            <p className="text-muted-foreground text-sm mb-6">Rekap distribusi dan penukaran poin seluruh member</p>
            <div className="grid md:grid-cols-3 gap-5">
              {[{ l: "Total Poin Beredar", v: "428.300" }, { l: "Ditukarkan Bulan Ini", v: "12.450" }, { l: "Rata-Rata Poin/Member", v: "1.250" }].map(s => (
                <div key={s.l} className="bg-white rounded-2xl border border-border p-5">
                  <div className="text-2xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#DAA520" }}>{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "settings" && (
          <div className="p-8">
            <h1 className="text-xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Pengaturan Sistem</h1>
            <p className="text-muted-foreground text-sm">Konfigurasi platform membership Ranata Tour</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page | "auth">("landing");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const openAuth = (tab: "login" | "register") => { setAuthTab(tab); setPage("auth"); };
  const handleLogin = (role: "customer" | "admin") => { setPage(role === "admin" ? "admin" : "customer"); };

  // Inject global animation keyframes once
  useEffect(() => {
    const id = "ranata-animations";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      /* ── Dropdown 3D reveal ── */
      @keyframes dropdownReveal {
        from { opacity: 0; transform: perspective(700px) rotateX(-14deg) translateY(-6px) scale(0.96); }
        to   { opacity: 1; transform: perspective(700px) rotateX(0deg)   translateY(0)    scale(1); }
      }
      .dropdown-animate {
        animation: dropdownReveal 0.26s cubic-bezier(0.16,1,0.3,1) forwards;
        transform-origin: top center;
      }
      /* staggered items inside dropdown */
      .dropdown-animate > * { animation: dropdownItem 0.3s ease both; }
      .dropdown-animate > *:nth-child(1) { animation-delay: 0.04s; }
      .dropdown-animate > *:nth-child(2) { animation-delay: 0.10s; }
      .dropdown-animate > *:nth-child(3) { animation-delay: 0.16s; }
      @keyframes dropdownItem {
        from { opacity: 0; transform: translateX(-10px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      /* ── Page & section reveal ── */
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(26px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(36px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-36px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes authPageIn {
        from { opacity: 0; transform: scale(0.97) translateY(10px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.93); }
        to   { opacity: 1; transform: scale(1); }
      }

      /* ── Hero ── */
      @keyframes heroFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33%       { transform: translateY(-9px) rotate(0.4deg); }
        66%       { transform: translateY(-5px) rotate(-0.3deg); }
      }
      .hero-float { animation: heroFloat 5s ease-in-out infinite; }

      @keyframes heroPanRight {
        from { transform: scale(1.08) translateX(0); }
        to   { transform: scale(1.12) translateX(-2%); }
      }
      .hero-bg { animation: heroPanRight 14s ease-in-out infinite alternate; }

      /* ── Shimmer CTA ── */
      @keyframes shimmerSlide {
        0%   { background-position: -300% center; }
        100% { background-position: 300% center; }
      }
      .shimmer-btn {
        background: linear-gradient(110deg, #B8860B 0%, #DAA520 30%, #f5d060 50%, #DAA520 70%, #B8860B 100%);
        background-size: 300% auto;
        animation: shimmerSlide 18s linear infinite;
        color: #2a1800;
      }
      .shimmer-btn:hover { filter: brightness(1.08); transform: scale(1.03); }

      /* ── 3D card tilt ── */
      .card-3d {
        transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        will-change: transform;
      }
      .card-3d:hover {
        transform: perspective(900px) rotateY(4deg) rotateX(-3deg) translateY(-5px) scale(1.015);
        box-shadow: 0 24px 64px rgba(128,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06);
      }

      /* ── Nav underline ── */
      .nav-underline { position: relative; }
      .nav-underline::after {
        content: ''; position: absolute; bottom: -3px; left: 0;
        width: 0; height: 2px; background: #800000;
        transition: width 0.3s cubic-bezier(0.34,1.56,0.64,1);
        border-radius: 2px;
      }
      .nav-underline:hover::after { width: 100%; }

      /* ── Scroll reveal (JS adds .visible) ── */
      .scroll-reveal {
        opacity: 0; transform: translateY(28px);
        transition: opacity 0.65s ease, transform 0.65s cubic-bezier(0.16,1,0.3,1);
      }
      .scroll-reveal.visible { opacity: 1; transform: translateY(0); }

      /* ── Pulse glow on badge ── */
      @keyframes badgeGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(218,165,32,0.5); }
        50%       { box-shadow: 0 0 0 7px rgba(218,165,32,0); }
      }
      .badge-glow { animation: badgeGlow 2.4s ease-in-out infinite; }

      /* ── Spin-in for statistics ── */
      @keyframes countUp {
        from { opacity: 0; transform: translateY(12px) scale(0.85); }
        to   { opacity: 1; transform: translateY(0)    scale(1); }
      }
      .stat-anim { animation: countUp 0.5s ease both; }
    `;
    document.head.appendChild(s);
  }, []);

  // Scroll-reveal observer
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
    <div className="size-full">
      {page === "landing" && <LandingPage onOpenLogin={openAuth} />}
      {page === "auth"    && <AuthPage tab={authTab} onTabChange={setAuthTab} onLogin={handleLogin} onBack={() => setPage("landing")} />}
      {page === "customer" && <CustomerApp onLogout={() => setPage("landing")} />}
      {page === "admin"   && <AdminApp onLogout={() => setPage("landing")} />}
    </div>
  );
}
