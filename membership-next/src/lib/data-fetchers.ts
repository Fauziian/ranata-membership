import {
  mockMembers,
  mockTransactions,
  mockInvoices,
  rewards,
  initMessages,
  customerTransactions,
  tripTimeline,
  services,
  mockTravelers
} from "@/data/mock";
import type { Tier, TravelStatus, TxStatus, InvStatus, ChatMessage } from "@/types";
import { getStoredUser, getToken, memberApi, adminApi } from "@/lib/api";

const isClient = typeof window !== "undefined";

// ─── LOCAL STORAGE FALLBACKS ──────────────────────────────────────────────────
export function getMembersList() {
  if (isClient) {
    const saved = localStorage.getItem("ranata_members");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem("ranata_members", JSON.stringify(mockMembers));
  }
  return mockMembers;
}

export function saveMembersList(members: any[]) {
  if (isClient) {
    localStorage.setItem("ranata_members", JSON.stringify(members));
  }
}

export function getInvoices() {
  if (isClient) {
    const saved = localStorage.getItem("ranata_invoices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem("ranata_invoices", JSON.stringify(mockInvoices));
  }
  return mockInvoices;
}

export function saveInvoices(invoices: any[]) {
  if (isClient) {
    localStorage.setItem("ranata_invoices", JSON.stringify(invoices));
  }
}

export function getTransactionsList() {
  if (isClient) {
    const saved = localStorage.getItem("ranata_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem("ranata_transactions", JSON.stringify(mockTransactions));
  }
  return mockTransactions;
}

export function saveTransactionsList(transactions: any[]) {
  if (isClient) {
    localStorage.setItem("ranata_transactions", JSON.stringify(transactions));
  }
}

// ─── CUSTOMER PROFILE ────────────────────────────────────────────────────────
export function getMemberProfile(memberId = "RT-2024-001") {
  // Jika ada user login di session, gunakan data real dari localStorage cache
  const loggedInUser = getStoredUser();
  if (loggedInUser && loggedInUser.role === "customer") {
    return {
      id: loggedInUser.member_id || "RT-2024-001",
      name: loggedInUser.name,
      email: loggedInUser.email,
      phone: loggedInUser.phone || "0812-3456-7890",
      tier: loggedInUser.tier,
      points: loggedInUser.points,
      joinedDate: loggedInUser.joined_date || "Agustus 2026",
      totalServices: loggedInUser.total_services || 0,
      pointsExpiry: "31 Des 2026",
      address: loggedInUser.address || "Belum diatur",
      city: loggedInUser.city || "Belum diatur",
      birthdate: loggedInUser.birthdate || "Belum diatur",
      avatar: loggedInUser.avatar || null,
    };
  }

  // Fallback ke data mock jika belum ada user login
  const members = getMembersList();
  const member = members.find((m: any) => m.member_id === memberId || m.id === memberId) || members[0];
  return {
    ...member,
    joinedDate: "Januari 2022",
    totalServices: 24,
    pointsExpiry: "31 Des 2026",
    address: "Jl. Melati No. 12, Komplek Griya Indah",
    city: "Jakarta Selatan",
    birthdate: "1990-05-15",
  };
}

export function getNotifications() {
  return [
    {
      title: "Invoice Baru Dari Admin",
      desc: "Tagihan Tiket CGK-DPS Rp 2.700.000 siap dibayar",
      time: "5 menit lalu",
      dot: "#EF4444",
      targetTab: "tagihan",
    },
    {
      title: "Pembayaran Diverifikasi",
      desc: "Transaksi TRX-002 telah dikonfirmasi admin",
      time: "2 jam lalu",
      dot: "#22C55E",
      targetTab: "riwayat",
    },
    {
      title: "Poin Ditambahkan",
      desc: "+12 poin dari Tiket Pesawat CGK-DPS",
      time: "2 jam lalu",
      dot: "#DAA520",
      targetTab: "riwayat",
    },
  ];
}

export function getRecentTransactions() {
  return customerTransactions;
}

export function getTravelTimeline() {
  return tripTimeline;
}

export function getRewardsList() {
  if (isClient) {
    const saved = localStorage.getItem("ranata_rewards");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem("ranata_rewards", JSON.stringify(rewards));
  }
  return rewards;
}

export function saveRewardsList(newRewards: any[]) {
  if (isClient) {
    localStorage.setItem("ranata_rewards", JSON.stringify(newRewards));
  }
}

export function getServicesList() {
  return services;
}

export function getInitMessages() {
  return initMessages;
}

export function getTravelersList() {
  return mockTravelers;
}
