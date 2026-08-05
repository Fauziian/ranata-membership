/**
 * API Client — Ranata Tour Membership
 * Semua HTTP calls ke Laravel backend.
 * Untuk lokal gunakan http://127.0.0.1:8000/api.
 * Untuk produksi Vercel gunakan URL backend yang sudah disediakan.
 */

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const isDevelopment = process.env.NODE_ENV === "development";
const API_BASE = isDevelopment
  ? (configuredApiUrl && !configuredApiUrl.includes("vercel.app")
      ? configuredApiUrl
      : "http://127.0.0.1:8000/api")
  : (configuredApiUrl ?? "https://ranata-membership.vercel.app/api");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  member_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "customer";
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  points: number;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  birthdate: string | null;
  avatar: string | null;
  joined_date?: string;
  total_services?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  midtrans_client_key?: string;
  midtrans_is_production?: boolean;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ranata_token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("ranata_token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("ranata_token");
  localStorage.removeItem("ranata_user");
};

export const getStoredUser = (): ApiUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("ranata_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const setStoredUser = (user: ApiUser): void => {
  localStorage.setItem("ranata_user", JSON.stringify(user));
};

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? `HTTP ${res.status}`,
        errors: data.errors,
      };
    }

    return data;
  } catch (err) {
    console.error("[API Error]", endpoint, err);
    return {
      success: false,
      message: "Tidak dapat terhubung ke server. Pastikan backend Laravel tersedia dan NEXT_PUBLIC_API_URL sudah benar.",
    };
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    google_id?: string;
    avatar?: string;
  }) => apiFetch<{ user: ApiUser; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  login: (email: string, password: string) =>
    apiFetch<{ user: ApiUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiFetch("/auth/logout", { method: "POST" }),

  me: () => apiFetch<ApiUser>("/auth/me"),

  getGoogleUrl: () => apiFetch<{ url: string }>("/auth/google"),
};

// ─── Member API ───────────────────────────────────────────────────────────────

export const memberApi = {
  getProfile: () => apiFetch<ApiUser>("/member/profile"),

  updateProfile: (data: Partial<ApiUser> & { latitude?: number | null; longitude?: number | null }) =>
    apiFetch<ApiUser>("/member/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  upgrade: (tier: "Silver" | "Gold" | "Platinum") =>
    apiFetch<any>("/member/upgrade", {
      method: "POST",
      body: JSON.stringify({ tier }),
    }),

  getInvoices: () => apiFetch<any[]>("/member/invoices"),

  payInvoice: (id: number, formData: FormData) =>
    fetch(`${API_BASE}/member/invoices/${id}/pay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
      },
      body: formData, // FormData handles multipart
    }).then((r) => r.json()),

  cancelInvoice: (id: number) =>
    apiFetch<any>(`/member/invoices/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  processPayment: (id: number) =>
    apiFetch<any>(`/member/invoices/${id}/process-payment`, {
      method: "POST",
    }),

  getTransactions: () => apiFetch<any[]>("/member/transactions"),

  getRewards: () => apiFetch<any[]>("/member/rewards"),

  redeemReward: (id: number) =>
    apiFetch(`/member/rewards/${id}/redeem`, { method: "POST" }),

  getTrips: () => apiFetch<any>("/member/trips"),

  getChat: () => apiFetch<any>("/member/chat"),

  sendChatMessage: (text: string, time: string, imageUrl?: string) =>
    apiFetch<any>("/member/chat", {
      method: "POST",
      body: JSON.stringify({ text, time, image_url: imageUrl }),
    }),

  selectService: (service: string, time: string) =>
    apiFetch<any>("/member/chat/select-service", {
      method: "POST",
      body: JSON.stringify({ service, time }),
    }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => apiFetch<any>("/admin/stats"),

  getMembers: (search?: string) =>
    apiFetch<any[]>(`/admin/members${search ? `?search=${search}` : ""}`),

  getTransactions: (status?: string) =>
    apiFetch<any[]>(`/admin/transactions${status ? `?status=${status}` : ""}`),

  verifyTransaction: (id: number, status: "verified" | "rejected", notes?: string) =>
    apiFetch(`/admin/transactions/${id}/verify`, {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),

  getRewards: () => apiFetch<any[]>("/admin/rewards"),

  createReward: (data: any) =>
    apiFetch("/admin/rewards", { method: "POST", body: JSON.stringify(data) }),

  updateReward: (id: number, data: any) =>
    apiFetch(`/admin/rewards/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteReward: (id: number) =>
    apiFetch(`/admin/rewards/${id}`, { method: "DELETE" }),

  getTrips: () => apiFetch<any>("/admin/trips"),

  updateTripStepStatus: (id: number, status: string, coords?: { lat: number; lng: number }) =>
    apiFetch<any>(`/admin/trip-steps/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        ...(coords ? { driver_lat: coords.lat, driver_lng: coords.lng } : {})
      }),
    }),

  getChats: () => apiFetch<any[]>("/admin/chats"),

  getChatSession: (memberId: string) =>
    apiFetch<any>(`/admin/chats/${memberId}`),

  sendChatMessage: (memberId: string, text: string, time: string) =>
    apiFetch<any>(`/admin/chats/${memberId}/message`, {
      method: "POST",
      body: JSON.stringify({ text, time }),
    }),

  toggleAI: (memberId: string, isHandledByAI: boolean) =>
    apiFetch<any>(`/admin/chats/${memberId}/toggle-ai`, {
      method: "POST",
      body: JSON.stringify({ is_handled_by_ai: isHandledByAI }),
    }),

  simulateIdle: (memberId: string) =>
    apiFetch<any>(`/admin/chats/${memberId}/simulate-idle`, {
      method: "POST",
    }),
};
