// ─── Shared Types ──────────────────────────────────────────────────────────────
// Dipindah dari App.tsx — tidak ada perubahan, hanya diekstrak ke file terpisah

export type Page = "landing" | "customer" | "admin";
export type CustomerTab =
  | "dashboard"
  | "layanan"
  | "tagihan"
  | "perjalanan"
  | "redeem"
  | "riwayat"
  | "profil";
export type AdminTab =
  | "overview"
  | "map"
  | "members"
  | "transactions"
  | "points"
  | "settings";
export type Tier = "Platinum" | "Gold" | "Silver" | "Bronze";
export type TravelStatus = "waiting" | "in-progress" | "done";
export type TxStatus = "pending" | "verified" | "rejected";
export type InvStatus =
  | "pending-payment"
  | "waiting-verification"
  | "verified"
  | "rejected";

export interface ChatMessage {
  id: number;
  sender: "customer" | "admin";
  text: string;
  time: string;
}
