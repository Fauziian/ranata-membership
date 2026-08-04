// ─── Mock Data ─────────────────────────────────────────────────────────────────
// Dipindah dari App.tsx — identik 100%
// Tahap 4: data ini akan diganti fetch ke API Laravel

import type { Tier, TravelStatus, TxStatus, InvStatus, ChatMessage } from "@/types";
import {
  Hotel, Car, Plane, FileText, Star, Globe, Coffee, Shield,
  Building, MessageCircle, CreditCard, LayoutDashboard,
  Navigation, Award, User
} from "lucide-react";

export const mockMembers = [
  { id: "RT-2024-001", name: "Ahmad Fauzi", tier: "Platinum" as Tier, points: 12450, joined: "Jan 2022", status: "Active", phone: "0812-3456-7890" },
  { id: "RT-2024-002", name: "Siti Rahayu", tier: "Gold" as Tier, points: 7820, joined: "Mar 2022", status: "Active", phone: "0813-4567-8901" },
  { id: "RT-2024-003", name: "Budi Santoso", tier: "Gold" as Tier, points: 6540, joined: "Jun 2022", status: "Active", phone: "0814-5678-9012" },
  { id: "RT-2024-004", name: "Dewi Lestari", tier: "Silver" as Tier, points: 3200, joined: "Sep 2022", status: "Active", phone: "0815-6789-0123" },
  { id: "RT-2024-005", name: "Eko Prasetyo", tier: "Silver" as Tier, points: 2890, joined: "Nov 2022", status: "Inactive", phone: "0816-7890-1234" },
  { id: "RT-2024-006", name: "Fitri Handayani", tier: "Bronze" as Tier, points: 1200, joined: "Feb 2023", status: "Active", phone: "0817-8901-2345" },
  { id: "RT-2024-007", name: "Gunawan Wibowo", tier: "Platinum" as Tier, points: 18920, joined: "Des 2021", status: "Active", phone: "0818-9012-3456" },
  { id: "RT-2024-008", name: "Hana Putri", tier: "Bronze" as Tier, points: 980, joined: "Mei 2023", status: "Active", phone: "0819-0123-4567" },
];

export const mockTransactions = [
  { id: "TRX-001", member: "Ahmad Fauzi", service: "Paket Umroh Premium", amount: "Rp 28.500.000", date: "20 Jul 2026", status: "pending" as TxStatus, proof: "transfer_bca_001.jpg", points: 285 },
  { id: "TRX-002", member: "Siti Rahayu", service: "Tiket Pesawat CGK-DPS", amount: "Rp 1.250.000", date: "19 Jul 2026", status: "verified" as TxStatus, proof: "bukti_transfer.jpg", points: 12 },
  { id: "TRX-003", member: "Budi Santoso", service: "Hotel Bintang 5 Bali 3N", amount: "Rp 4.800.000", date: "18 Jul 2026", status: "pending" as TxStatus, proof: "transfer_mandiri.jpg", points: 48 },
  { id: "TRX-004", member: "Dewi Lestari", service: "Sewa Alphard 3 Hari", amount: "Rp 2.100.000", date: "17 Jul 2026", status: "rejected" as TxStatus, proof: "transfer_bri.jpg", points: 21 },
  { id: "TRX-005", member: "Eko Prasetyo", service: "Wisata Raja Ampat 5D4N", amount: "Rp 12.750.000", date: "16 Jul 2026", status: "verified" as TxStatus, proof: "bukti_bayar_005.jpg", points: 127 },
  { id: "TRX-006", member: "Gunawan Wibowo", service: "Business Class JKT-SIN", amount: "Rp 8.600.000", date: "15 Jul 2026", status: "pending" as TxStatus, proof: "transfer_bca_006.jpg", points: 86 },
];

export const mockTravelers = [
  { id: 1, name: "Ahmad Fauzi", location: "Bandara Ngurah Rai, Bali", status: "waiting" as TravelStatus, service: "Jemput Bandara", lat: -8.748, lng: 115.167 },
  { id: 2, name: "Siti Rahayu", location: "Hotel Grand Hyatt, Jakarta", status: "done" as TravelStatus, service: "Antar Hotel", lat: -6.208, lng: 106.822 },
  { id: 3, name: "Budi Santoso", location: "Gili Trawangan, Lombok", status: "in-progress" as TravelStatus, service: "Paket Tour", lat: -8.352, lng: 115.756 },
  { id: 4, name: "Gunawan Wibowo", location: "Bandara Juanda, Surabaya", status: "waiting" as TravelStatus, service: "Jemput Bandara", lat: -7.380, lng: 112.787 },
  { id: 5, name: "Hana Putri", location: "Raja Ampat, Papua Barat", status: "in-progress" as TravelStatus, service: "Wisata Laut", lat: -0.869, lng: 130.978 },
  { id: 6, name: "Dewi Lestari", location: "Candi Borobudur, Yogyakarta", status: "done" as TravelStatus, service: "City Tour", lat: -7.608, lng: 110.204 },
];

export const mockInvoices = [
  {
    id: "INV-001", service: "Paket Umroh Premium — Nov 2026", amount: "Rp 28.500.000",
    date: "20 Jul 2026", status: "waiting-verification" as InvStatus, points: 285,
    detail: "2 orang dewasa • Keberangkatan 10 Nov 2026 • Makkah & Madinah 12 hari",
  },
  {
    id: "INV-002", service: "Tiket CGK-DPS 10-15 Okt, 2 orang", amount: "Rp 2.700.000",
    date: "22 Jul 2026", status: "pending-payment" as InvStatus, points: 27,
    detail: "Garuda GA-403 • Berangkat 06:30 WIB • Pulang DPS-CGK 18:45 WITA",
  },
];

export const rewards = [
  { id: 1, name: "Upgrade Kamar Suite", desc: "Upgrade hotel ke Suite 1 malam di hotel partner", points: 1500, category: "Hotel", icon: Hotel },
  { id: 2, name: "Transportasi Bandara", desc: "Antar-jemput bandara gratis dengan kendaraan ber-AC", points: 500, category: "Transport", icon: Car },
  { id: 3, name: "Diskon Tiket 20%", desc: "Potongan 20% pembelian tiket pesawat rute domestik", points: 800, category: "Tiket", icon: Plane },
  { id: 4, name: "City Tour 1 Hari", desc: "Paket city tour lengkap dengan pemandu wisata profesional", points: 1200, category: "Wisata", icon: Globe },
  { id: 5, name: "Voucher Kuliner Rp500K", desc: "Voucher makan di 50+ restoran partner di seluruh Indonesia", points: 600, category: "Kuliner", icon: Coffee },
  { id: 6, name: "Fast Track Dokumen", desc: "Prioritas pengurusan visa & dokumen 2× lebih cepat", points: 300, category: "Dokumen", icon: FileText },
  { id: 7, name: "Diskon Umroh 10%", desc: "Diskon 10% dari harga paket Umroh reguler 1 orang", points: 3000, category: "Umroh", icon: Star },
  { id: 8, name: "Lounge Bandara 3×", desc: "Akses Premium Lounge di 8 bandara internasional", points: 1800, category: "Fasilitas", icon: Building },
];

export const initMessages: ChatMessage[] = [
  { id: 1, sender: "admin", text: "Selamat datang di Ranata Tour! Saya Rina, siap membantu Anda. Ada yang bisa kami bantu hari ini?", time: "09:00" },
  { id: 2, sender: "customer", text: "Halo, saya ingin pesan tiket pesawat ke Bali tanggal 10-15 Oktober, 2 orang dewasa.", time: "09:02" },
  { id: 3, sender: "admin", text: "Baik Pak Ahmad! Apakah prefer penerbangan pagi atau malam? Dan keberangkatan dari kota mana?", time: "09:03" },
  { id: 4, sender: "customer", text: "Dari Jakarta, pagi hari. Budget sekitar Rp 1.5 juta per orang.", time: "09:05" },
  { id: 5, sender: "admin", text: "Saya temukan pilihan terbaik: Garuda GA-403 CGK-DPS 06:30 = Rp 1.350.000/orang. Total 2 orang Rp 2.700.000. Apakah saya buatkan invoicenya sekarang, Pak?", time: "09:08" },
];

export const customerTransactions = [
  { id: "TRX-001", service: "Paket Umroh Premium", amount: "Rp 28.500.000", date: "20 Jul 2026", status: "pending" as TxStatus, points: "+285" },
  { id: "TRX-INV002", service: "Tiket CGK-DPS PP 2 orang", amount: "Rp 2.700.000", date: "22 Jul 2026", status: "pending" as TxStatus, points: "+27" },
  { id: "TRX-009", service: "Hotel Bali 3 Malam", amount: "Rp 3.600.000", date: "14 Mar 2026", status: "verified" as TxStatus, points: "+36" },
  { id: "TRX-012", service: "Tiket CGK-SUB PP", amount: "Rp 780.000", date: "02 Jan 2026", status: "verified" as TxStatus, points: "+8" },
];

export const tripTimeline = [
  { id: 1, label: "Penjemputan Rumah ke Bandara Jakarta", officer: "Bapak Danu (0812-9999-1111)", status: "done" as TravelStatus, time: "10 Okt 2026 — 04:30 WIB" },
  { id: 2, label: "Handling Bandara CGK (Check-in & Boarding)", officer: "Bapak Bagus (0813-8888-2222)", status: "in-progress" as TravelStatus, time: "10 Okt 2026 — 06:00 WIB" },
  { id: 3, label: "Penerbangan CGK → DPS (GA-403)", officer: "Garuda Indonesia GA-403", status: "waiting" as TravelStatus, time: "10 Okt 2026 — 06:30 WIB" },
  { id: 4, label: "Penjemputan di Bandara Ngurah Rai Bali", officer: "Bapak Ketut (0819-7777-3333)", status: "waiting" as TravelStatus, time: "10 Okt 2026 — 09:45 WITA" },
  { id: 5, label: "Antar ke Hotel & Handling Check-in", officer: "Bapak Ketut (0819-7777-3333)", status: "waiting" as TravelStatus, time: "10 Okt 2026 — 10:30 WITA" },
];

export const services = [
  { icon: Plane, label: "Tiket Pesawat", desc: "Domestik & internasional" },
  { icon: Hotel, label: "Hotel & Villa", desc: "1 – 5 bintang" },
  { icon: Car, label: "Sewa Transportasi", desc: "Mobil, bus, minibus" },
  { icon: FileText, label: "Pengurusan Dokumen", desc: "Visa, paspor, asuransi" },
  { icon: Star, label: "Paket Umroh", desc: "Regular & premium" },
  { icon: Globe, label: "Paket Wisata", desc: "Domestik & mancanegara" },
];
