// src/store/dashboardStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { api } from "../lib/api";

// Define interfaces based on inferred data from components
interface Overview {
  chambers: { active: number; inactive: number };
  orders: { completed: number; pending: number };
  products: { pending: number; approved: number };
  sellerApplications: { pending: number; approved: number };
}

interface DailySale {
  day: string;
  sales: number;
}

interface Chamber {
  id: string;
  grower: string;
  location: string;
  status: string;
}

interface ChamberRegistry {
  chambers: Chamber[];
  total: number;
  page: number;
  limit: number;
}

// UsersStats is dynamic: the API returns keys like USER, BUYER, ADMIN, GROWER, SUPER_ADMIN
type UsersStats = Record<string, number>;

interface CardsSummary {
  // Inferred from stat cards in dashboard-content.tsx
  chambers: { active: number; inactive: number };
  orders: { completed: number; pending: number };
  products: { pending: number; approved: number };
  sellerApplications: { pending: number; approved: number };
}

// Helper function to check if using mock admin tokens
function isMockAdminToken(): boolean {
  if (typeof window === "undefined") return false;
  const cookies = document.cookie;
  const hasMockToken = cookies.includes("authToken=admin-access-");
  if (hasMockToken) {
    console.log("🎭 Detected mock admin token");
  }
  return hasMockToken;
}

// Mock data for hardcoded admin
const MOCK_DASHBOARD_DATA = {
  overview: {
    chambers: { active: 12, inactive: 3 },
    orders: { completed: 145, pending: 23 },
    products: { pending: 8, approved: 56 },
    sellerApplications: { pending: 5, approved: 34 },
  },
  sales: [
    { day: "Mon", sales: 4500 },
    { day: "Tue", sales: 5200 },
    { day: "Wed", sales: 4800 },
    { day: "Thu", sales: 6100 },
    { day: "Fri", sales: 7300 },
    { day: "Sat", sales: 8200 },
    { day: "Sun", sales: 6800 },
  ],
  chambers: {
    chambers: [
      { id: "1", grower: "John's Farm", location: "Zone A", status: "Active" },
      { id: "2", grower: "Green Valley", location: "Zone B", status: "Active" },
      {
        id: "3",
        grower: "Mountain Grow",
        location: "Zone C",
        status: "Inactive",
      },
    ],
    total: 3,
    page: 1,
    limit: 10,
  },
  usersStats: {
    USER: 120,
    BUYER: 85,
    GROWER: 45,
    ADMIN: 8,
    SUPER_ADMIN: 2,
  },
  cards: {
    chambers: { active: 12, inactive: 3 },
    orders: { completed: 145, pending: 23 },
    products: { pending: 8, approved: 56 },
    sellerApplications: { pending: 5, approved: 34 },
  },
};

interface DashboardState {
  overview: Overview | null;
  sales: DailySale[] | null;
  chambers: ChamberRegistry | null;
  usersStats: UsersStats | null;
  // list of users for admin pages
  users: UserItem[] | null;
  cards: CardsSummary | null;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchOverview: () => Promise<void>;
  fetchSales: (days: number) => Promise<void>;
  fetchChambers: (page: number, limit: number) => Promise<void>;
  fetchUsersStats: () => Promise<void>;
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchCards: () => Promise<void>;
}

// lightweight user shape returned to UI
interface UserItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  avatar?: string;
  region?: string;
}

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => ({
    overview: null,
    sales: null,
    chambers: null,
    usersStats: null,
    users: null,
    cards: null,
    loading: {},
    error: {},

    fetchOverview: async () => {
      set({
        loading: { ...get().loading, overview: true },
        error: { ...get().error, overview: null },
      });

      try {
        console.log("📡 Fetching overview...");

        // Check if using mock admin token
        if (isMockAdminToken()) {
          console.log("🎭 Using mock admin data for overview");
          set({
            overview: MOCK_DASHBOARD_DATA.overview,
            loading: { ...get().loading, overview: false },
          });
          return;
        }

        // Log whether authToken cookie is present client-side
        try {
          const cookie = typeof document !== "undefined" ? document.cookie : "";
          const tokenPair = cookie
            .split(";")
            .map((p) => p.trim())
            .find((p) => p.startsWith("authToken="));
          let tokenValue: string | undefined = undefined;
          if (tokenPair) {
            tokenValue = decodeURIComponent(tokenPair.split("=")[1] || "");
          }
          console.log(
            "[dashboard] authToken present:",
            !!tokenValue,
            tokenValue
              ? `${tokenValue.slice(0, 8)}...(${tokenValue.length})`
              : "none"
          );
        } catch (e) {
          console.warn("[dashboard] failed to parse cookie", e);
        }

        const res = await api.get(`v1/super-admin/dashboard/overview`);

        // Some backend responses are wrapped: { success, statusCode, data: { ... } }
        // Normalize to the inner data object if present.
        const payload = res.data as any;
        const data: Overview = payload && payload.data ? payload.data : payload;

        // Defensive normalization: ensure nested objects exist to avoid runtime errors
        const normalized: Overview = {
          chambers: data?.chambers ?? { active: 0, inactive: 0 },
          orders: data?.orders ?? { completed: 0, pending: 0 },
          products: data?.products ?? { pending: 0, approved: 0 },
          sellerApplications: data?.sellerApplications ?? {
            pending: 0,
            approved: 0,
          },
        };

        set({
          overview: normalized,
          loading: { ...get().loading, overview: false },
        });
      } catch (err) {
        console.error("Failed to fetch overview:", err);
        set({
          error: { ...get().error, overview: (err as Error).message },
          loading: { ...get().loading, overview: false },
        });
      }
    },

    fetchSales: async (days: number = 7) => {
      set({
        loading: { ...get().loading, sales: true },
        error: { ...get().error, sales: null },
      });
      try {
        // Check if using mock admin token
        if (isMockAdminToken()) {
          console.log("🎭 Using mock admin data for sales");
          set({
            sales: MOCK_DASHBOARD_DATA.sales,
            loading: { ...get().loading, sales: false },
          });
          return;
        }

        const res = await api.get(`v1/super-admin/dashboard/sales`, {
          params: { days },
        });

        // API may return wrapped payload: { success, statusCode, data: { labels: [...], values: [...] } }
        const payload = res.data as Record<string, unknown>;

        let mapped: DailySale[] = [];

        if (Array.isArray(payload)) {
          // legacy: array of { day, sales }
          mapped = payload as DailySale[];
        } else if (payload?.data && typeof payload.data === "object") {
          const data = payload.data as { labels?: string[]; values?: number[] };
          if (data.labels && data.values) {
            const labels: string[] = data.labels || [];
            const values: number[] = data.values || [];
            mapped = labels.map((lbl, idx) => ({
              day: lbl,
              sales: Number(values[idx] ?? 0),
            }));
          } else if (Array.isArray(data)) {
            // sometimes data is already an array of objects
            mapped = data as DailySale[];
          }
        }

        set({ sales: mapped, loading: { ...get().loading, sales: false } });
      } catch (err) {
        set({
          error: { ...get().error, sales: (err as Error).message },
          loading: { ...get().loading, sales: false },
        });
      }
    },

    fetchChambers: async (page: number = 1, limit: number = 10) => {
      set({
        loading: { ...get().loading, chambers: true },
        error: { ...get().error, chambers: null },
      });

      console.log(
        `[store] GET v1/super-admin/dashboard/chambers → page=${page}, limit=${limit}`
      );
      try {
        // Check if using mock admin token
        if (isMockAdminToken()) {
          console.log("🎭 Using mock admin data for chambers");
          set({
            chambers: MOCK_DASHBOARD_DATA.chambers,
            loading: { ...get().loading, chambers: false },
          });
          return;
        }

        const res = await api.get(`v1/super-admin/dashboard/chambers`, {
          params: { page, limit },
        });

        // The API response is wrapped. Example shape:
        // { success, statusCode, data: { data: [ ...items ], meta: { total, page, limit } } }
        const payload = res.data as Record<string, unknown>;
        const dataObj = payload?.data as
          | { data?: unknown[]; meta?: Record<string, unknown> }
          | undefined;
        const items = (dataObj?.data || []) as Record<string, unknown>[];
        const meta = (dataObj?.meta || {}) as {
          total?: number;
          page?: number;
          limit?: number;
        };

        // Map API fields to internal Chamber type
        const mapped: Chamber[] = items.map((it) => ({
          id: String(it.chamberId ?? it.id ?? ""),
          grower: String(it.growerName ?? it.grower ?? ""),
          location: String(it.location ?? ""),
          status: String(it.status ?? ""),
        }));

        const chamberRegistry: ChamberRegistry = {
          chambers: mapped,
          total: meta.total ?? mapped.length,
          page: meta.page ?? page,
          limit: meta.limit ?? limit,
        };

        set({
          chambers: chamberRegistry,
          loading: { ...get().loading, chambers: false },
        });
      } catch (err) {
        set({
          error: { ...get().error, chambers: (err as Error).message },
          loading: { ...get().loading, chambers: false },
        });
      }
    },

    fetchUsersStats: async () => {
      set({
        loading: { ...get().loading, usersStats: true },
        error: { ...get().error, usersStats: null },
      });
      try {
        // Check if using mock admin token
        if (isMockAdminToken()) {
          console.log("🎭 Using mock admin data for usersStats");
          set({
            usersStats: MOCK_DASHBOARD_DATA.usersStats,
            loading: { ...get().loading, usersStats: false },
          });
          return;
        }

        const res = await api.get(`v1/super-admin/dashboard/users-stats`);

        // API returns: { success, statusCode, data: { USER: 1, BUYER: 5, ... } }
        const payload = res.data as Record<string, unknown>;
        const data: UsersStats = (payload?.data as UsersStats) || {};

        set({
          usersStats: data,
          loading: { ...get().loading, usersStats: false },
        });
      } catch (err) {
        set({
          error: { ...get().error, usersStats: (err as Error).message },
          loading: { ...get().loading, usersStats: false },
        });
      }
    },

    fetchUsers: async (page: number = 1, limit: number = 50) => {
      set({
        loading: { ...get().loading, users: true },
        error: { ...get().error, users: null },
      });

      try {
        const res = await api.get(`v1/users`, { params: { page, limit } });

        // Normalize possible response shapes:
        // 1) { success, statusCode, data: { data: [...], meta: { total, page, limit } } }
        // 2) { success, statusCode, data: [...] }
        // 3) Array of users or plain object
        const payload = res.data as any;

        let items: any[] = [];

        if (Array.isArray(payload)) {
          items = payload;
        } else if (payload?.data) {
          if (Array.isArray(payload.data)) {
            items = payload.data;
          } else if (Array.isArray(payload.data?.data)) {
            items = payload.data.data;
          }
        } else if (typeof payload === "object") {
          // try to detect common wrapper
          items = payload.items || payload.users || [];
        }

        const mapped: UserItem[] = (items || []).map((u) => ({
          id: String(u.id ?? u.userId ?? u._id ?? ""),
          name: String(
            u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`
          ).trim(),
          username: u.username ?? u.userName ?? undefined,
          email: u.email ?? undefined,
          phone: u.phone ?? u.mobile ?? undefined,
          role: u.role ?? undefined,
          status: u.status ?? undefined,
          avatar:
            u.avatar ??
            (u.name
              ? u.name
                  .split(" ")
                  .map((s: string) => s[0])
                  .join("")
                  .slice(0, 2)
              : undefined),
          region: u.region ?? u.location ?? undefined,
        }));

        set({ users: mapped, loading: { ...get().loading, users: false } });
      } catch (err) {
        console.error("Failed to fetch users:", err);
        set({
          error: { ...get().error, users: (err as Error).message },
          loading: { ...get().loading, users: false },
        });
      }
    },

    fetchCards: async () => {
      set({
        loading: { ...get().loading, cards: true },
        error: { ...get().error, cards: null },
      });
      try {
        // Check if using mock admin token
        if (isMockAdminToken()) {
          console.log("🎭 Using mock admin data for cards");
          set({
            cards: MOCK_DASHBOARD_DATA.cards,
            loading: { ...get().loading, cards: false },
          });
          return;
        }

        const res = await api.get(`v1/super-admin/dashboard/cards`);
        const data: CardsSummary = res.data;
        set({ cards: data, loading: { ...get().loading, cards: false } });
      } catch (err) {
        set({
          error: { ...get().error, cards: (err as Error).message },
          loading: { ...get().loading, cards: false },
        });
      }
    },
  }))
);
