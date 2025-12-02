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
import { api } from "@/lib/api";

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
export interface UserItem {
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
        const res = await api.get(`v1/super-admin/dashboard/overview`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;

        // Extract nested cards data
        let data: Overview | null = null;

        if (payload?.data?.cards) {
          data = payload.data.cards;
        } else if (payload?.data) {
          data = payload.data;
        } else {
          data = payload;
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

        set({
          overview: normalized,
          loading: { ...get().loading, overview: false },
        });
      } catch (err) {
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
        const res = await api.get(`v1/super-admin/dashboard/sales`, {
          params: { days },
        });

        const payload = res.data as Record<string, unknown>;
        let mapped: DailySale[] = [];

        // Helper function to convert ISO date to readable format
        const formatDate = (dateString: string): string => {
          try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              return dateString; // Return original if invalid
            }

            // For dates within last 7 days, show day name (Mon, Tue, etc.)
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];

            // Format: "Mon 13" or "Nov 13" depending on range
            if (days <= 7) {
              return `${dayNames[date.getDay()]} ${date.getDate()}`;
            } else if (days <= 31) {
              return `${monthNames[date.getMonth()]} ${date.getDate()}`;
            } else {
              return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            }
          } catch {
            return dateString; // Return original on error
          }
        };

        if (Array.isArray(payload)) {
          // legacy: array of { day, sales }
          mapped = (payload as DailySale[]).map((item) => ({
            day: formatDate(item.day),
            sales: item.sales,
          }));
        } else if (payload?.data && typeof payload.data === "object") {
          const data = payload.data as { labels?: string[]; values?: number[] };
          if (data.labels && data.values) {
            const labels: string[] = data.labels || [];
            const values: number[] = data.values || [];
            mapped = labels.map((lbl, idx) => ({
              day: formatDate(lbl),
              sales: Number(values[idx] ?? 0),
            }));
          } else if (Array.isArray(data)) {
            // sometimes data is already an array of objects
            mapped = (data as DailySale[]).map((item) => ({
              day: formatDate(item.day),
              sales: item.sales,
            }));
          }
        }

        set({ sales: mapped, loading: { ...get().loading, sales: false } });
      } catch (err) {
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

      try {
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
        const res = await api.get(`v1/super-admin/dashboard/users-stats`);
        const payload = res.data as Record<string, unknown>;
        const data: UsersStats = (payload?.data as UsersStats) || {};

        set({
          usersStats: data,
          loading: { ...get().loading, usersStats: false },
        });
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Failed to fetch user statistics";

        set({
          error: { ...get().error, usersStats: errorMessage },
          loading: { ...get().loading, usersStats: false },
        });
      }
    },

    fetchUsers: async (page: number = 1, limit: number = 50) => {
      console.log("[dashboardStore] fetchUsers called with:", { page, limit });

      // Check if user is authenticated before making API call
      if (typeof window !== "undefined") {
        const cookie = document.cookie;
        const hasRefreshToken = cookie.includes("refreshToken=");
        console.log("[dashboardStore] 🔐 Authentication check:", {
          refreshToken: hasRefreshToken ? "✓ present" : "✗ MISSING",
          warning: !hasRefreshToken
            ? "⚠️ User not logged in - API call will fail with 401"
            : null,
        });

        if (!hasRefreshToken) {
          // eslint-disable-next-line no-console
          console.error(
            "[dashboardStore] ❌ Cannot fetch users - no refresh token. User needs to log in."
          );
        }
      }

      set({
        loading: { ...get().loading, users: true },
        error: { ...get().error, users: null },
      });

      try {
        console.log("[dashboardStore] Fetching users from API: v1/users");
        const res = await api.get(`v1/users`, { params: { page, limit } });
        console.log("[dashboardStore] API response received:", res.data);

        // Normalize possible response shapes:
        // 1) { success, statusCode, data: { data: [...], meta: { total, page, limit } } }
        // 2) { success, statusCode, data: [...] }
        // 3) Array of users or plain object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;
        console.log(
          "[dashboardStore] Payload type:",
          Array.isArray(payload) ? "array" : typeof payload
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let items: any[] = [];

        if (Array.isArray(payload)) {
          console.log(
            "[dashboardStore] Payload is array, length:",
            payload.length
          );
          items = payload;
        } else if (payload?.data) {
          if (Array.isArray(payload.data)) {
            console.log(
              "[dashboardStore] payload.data is array, length:",
              payload.data.length
            );
            items = payload.data;
          } else if (Array.isArray(payload.data?.data)) {
            console.log(
              "[dashboardStore] payload.data.data is array, length:",
              payload.data.data.length
            );
            items = payload.data.data;
          }
        } else if (typeof payload === "object") {
          // try to detect common wrapper
          items = payload.items || payload.users || [];
          console.log(
            "[dashboardStore] Extracted items from object wrapper, length:",
            items.length
          );
        }

        console.log("[dashboardStore] Raw items before mapping:", items);

        // Log first user's raw data to see available fields
        if (items.length > 0) {
          console.log("[dashboardStore] Sample raw user object:", items[0]);
          console.log(
            "[dashboardStore] Available keys in raw user:",
            Object.keys(items[0])
          );
        }

        const mapped: UserItem[] = (items || []).map((u) => {
          // Try multiple possible role field names
          const roleValue =
            u.role ?? u.userRole ?? u.type ?? u.accountType ?? undefined;

          console.log(`[dashboardStore] Mapping user ${u.id}:`, {
            rawRole: u.role,
            rawUserRole: u.userRole,
            rawType: u.type,
            rawAccountType: u.accountType,
            finalRole: roleValue,
          });

          return {
            id: String(u.id ?? u.userId ?? u._id ?? ""),
            name: String(
              u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`
            ).trim(),
            username: u.username ?? u.userName ?? undefined,
            email: u.email ?? undefined,
            phone: u.phone ?? u.mobile ?? undefined,
            role: roleValue,
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
          };
        });

        console.log("[dashboardStore] Mapped users:", mapped);
        console.log("[dashboardStore] Total users fetched:", mapped.length);

        set({ users: mapped, loading: { ...get().loading, users: false } });
      } catch (err) {
        const errorMessage = (err as Error).message || "Failed to fetch users";
        console.error("[dashboardStore] fetchUsers error:", {
          message: errorMessage,
          error: err,
        });

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
        const res = await api.get(`v1/super-admin/dashboard/cards`);
        const data: CardsSummary = res.data;

        set({ cards: data, loading: { ...get().loading, cards: false } });
      } catch (err) {
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
