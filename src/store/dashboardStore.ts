// src/store/dashboardStore.ts
/**
 * Dashboard Store - Secure Token Management Implementation
 *
 * SECURITY ARCHITECTURE:
 * ✅ Access Token: Stored in memory via tokenManager (XSS protection)
 * ✅ Refresh Token: HttpOnly cookie (automatic, XSS protection)
 * ✅ All API calls use `api` instance which automatically:
 *    - Adds Authorization: Bearer {accessToken} header
 *    - Includes credentials: "include" for refresh cookie
 *    - Handles 401 errors with automatic token refresh + retry
 *
 * NO COOKIE PARSING: This store never reads document.cookie directly.
 * Token management is handled by:
 * - /src/lib/tokenManager.ts (in-memory access token)
 * - /src/lib/api.ts (axios interceptors for automatic refresh)
 *
 * See SECURE_TOKEN_IMPLEMENTATION.md for complete documentation.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { api } from "../lib/api";
import { getAccessToken } from "../lib/tokenManager";

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
        console.log("📡 [fetchOverview] Starting request...");

        // ✅ api instance automatically:
        // - Adds Authorization: Bearer {accessToken} header
        // - Includes credentials: "include" for refresh cookie
        // - Handles 401 with automatic token refresh and retry
        const res = await api.get(`v1/super-admin/dashboard/overview`);

        // API Response structure: { success, statusCode, data: { cards: { chambers, orders, products, sellerApplications } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;

        console.log("[fetchOverview] Full payload:", payload);

        // Extract nested cards data
        let data: Overview | null = null;

        if (payload?.data?.cards) {
          // Expected structure: { data: { cards: { chambers, orders, ... } } }
          data = payload.data.cards;
          console.log(
            "[fetchOverview] ✅ Found data at payload.data.cards:",
            data
          );
        } else if (payload?.data) {
          // Fallback: data might be directly at payload.data
          data = payload.data;
          console.log("[fetchOverview] Found data at payload.data:", data);
        } else {
          // Last resort: payload is the data
          data = payload;
          console.log("[fetchOverview] Using payload as data:", data);
        }

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

        console.log("[fetchOverview] Normalized data:", normalized);

        set({
          overview: normalized,
          loading: { ...get().loading, overview: false },
        });
      } catch (err) {
        console.error("[fetchOverview] Failed to fetch overview:", err);

        // api interceptor already handled 401 with refresh attempt
        // If we still get an error here, it means refresh failed or other error
        const errorMessage =
          (err as Error).message || "Failed to fetch overview";

        set({
          error: { ...get().error, overview: errorMessage },
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
        console.log(`📡 [fetchSales] Fetching ${days} days of sales data...`);

        // ✅ api instance handles token automatically
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
        console.error("[fetchSales] Failed to fetch sales data:", err);

        const errorMessage =
          (err as Error).message || "Failed to fetch sales data";

        set({
          error: { ...get().error, sales: errorMessage },
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
        `📡 [fetchChambers] Fetching chambers → page=${page}, limit=${limit}`
      );
      try {
        // ✅ api instance handles token automatically
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
        console.error("[fetchChambers] Failed to fetch chambers:", err);

        const errorMessage =
          (err as Error).message || "Failed to fetch chambers";

        set({
          error: { ...get().error, chambers: errorMessage },
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
        console.log("📡 [fetchUsersStats] Fetching user statistics...");

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/super-admin/dashboard/users-stats`);

        // API returns: { success, statusCode, data: { USER: 1, BUYER: 5, ... } }
        const payload = res.data as Record<string, unknown>;
        const data: UsersStats = (payload?.data as UsersStats) || {};

        set({
          usersStats: data,
          loading: { ...get().loading, usersStats: false },
        });
      } catch (err) {
        console.error(
          "[fetchUsersStats] Failed to fetch user statistics:",
          err
        );

        const errorMessage =
          (err as Error).message || "Failed to fetch user statistics";

        set({
          error: { ...get().error, usersStats: errorMessage },
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
        console.log(
          `📡 [fetchUsers] Fetching users → page=${page}, limit=${limit}`
        );

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/users`, { params: { page, limit } });

        // Normalize possible response shapes:
        // 1) { success, statusCode, data: { data: [...], meta: { total, page, limit } } }
        // 2) { success, statusCode, data: [...] }
        // 3) Array of users or plain object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              ? String(u.name)
                  .split(" ")
                  .map((s: string) => s[0])
                  .join("")
                  .slice(0, 2)
              : undefined),
          region: u.region ?? u.location ?? undefined,
        }));

        set({ users: mapped, loading: { ...get().loading, users: false } });
      } catch (err) {
        console.error("[fetchUsers] Failed to fetch users:", err);

        const errorMessage = (err as Error).message || "Failed to fetch users";

        set({
          error: { ...get().error, users: errorMessage },
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
        console.log("📡 [fetchCards] Fetching summary cards...");

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/super-admin/dashboard/cards`);
        const data: CardsSummary = res.data;
        set({ cards: data, loading: { ...get().loading, cards: false } });
      } catch (err) {
        console.error("[fetchCards] Failed to fetch summary cards:", err);

        const errorMessage =
          (err as Error).message || "Failed to fetch summary cards";

        set({
          error: { ...get().error, cards: errorMessage },
          loading: { ...get().loading, cards: false },
        });
      }
    },
  }))
);
