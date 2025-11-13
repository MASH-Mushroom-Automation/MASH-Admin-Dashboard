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
      console.log("\n========================================");
      console.log("[debug:fetchOverview] 🚀 STARTING fetchOverview");
      console.log("========================================");

      // Check token status
      const token = getAccessToken();
      console.log("[debug:fetchOverview] 🔐 Access token status:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
      });

      set({
        loading: { ...get().loading, overview: true },
        error: { ...get().error, overview: null },
      });

      try {
        console.log("[debug:fetchOverview] 📡 Preparing API call...");
        console.log(
          "[debug:fetchOverview] 📍 Endpoint: v1/super-admin/dashboard/overview"
        );
        console.log("[debug:fetchOverview] 🔧 Method: GET");
        console.log(
          "[debug:fetchOverview] 📦 Using api instance (automatic token injection)"
        );

        // ✅ api instance automatically:
        // - Adds Authorization: Bearer {accessToken} header
        // - Includes credentials: "include" for refresh cookie
        // - Handles 401 with automatic token refresh and retry
        console.log("[debug:fetchOverview] ⏳ Sending request to backend...");
        const res = await api.get(`v1/super-admin/dashboard/overview`);
        console.log("[debug:fetchOverview] ✅ API call completed successfully");

        // Log response details
        console.log("[debug:fetchOverview] 📥 Response status:", res.status);
        console.log("[debug:fetchOverview] 📥 Response headers:", res.headers);

        // API Response structure: { success, statusCode, data: { cards: { chambers, orders, products, sellerApplications } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;

        console.log(
          "[debug:fetchOverview] 📦 Full response payload:",
          JSON.stringify(payload, null, 2)
        );
        console.log("[debug:fetchOverview] 🔍 Payload structure analysis:", {
          hasSuccess: "success" in payload,
          successValue: payload?.success,
          hasStatusCode: "statusCode" in payload,
          statusCode: payload?.statusCode,
          hasData: "data" in payload,
          dataType: typeof payload?.data,
          hasDataCards: payload?.data?.cards !== undefined,
        });

        // Extract nested cards data
        console.log("[debug:fetchOverview] 🔍 Starting data extraction...");
        let data: Overview | null = null;
        let dataPath = "UNKNOWN";

        if (payload?.data?.cards) {
          // Expected structure: { data: { cards: { chambers, orders, ... } } }
          data = payload.data.cards;
          dataPath = "payload.data.cards";
          console.log(
            "[debug:fetchOverview] ✅ Found data at payload.data.cards"
          );
          console.log(
            "[debug:fetchOverview] 📊 Data content:",
            JSON.stringify(data, null, 2)
          );
        } else if (payload?.data) {
          // Fallback: data might be directly at payload.data
          data = payload.data;
          dataPath = "payload.data";
          console.log(
            "[debug:fetchOverview] ⚠️ Found data at payload.data (fallback path)"
          );
          console.log(
            "[debug:fetchOverview] 📊 Data content:",
            JSON.stringify(data, null, 2)
          );
        } else {
          // Last resort: payload is the data
          data = payload;
          dataPath = "payload (root)";
          console.log(
            "[debug:fetchOverview] ⚠️ Using payload as data (last resort)"
          );
          console.log(
            "[debug:fetchOverview] 📊 Data content:",
            JSON.stringify(data, null, 2)
          );
        }

        console.log("[debug:fetchOverview] 📍 Data extracted from:", dataPath);

        // Defensive normalization: ensure nested objects exist to avoid runtime errors
        console.log("[debug:fetchOverview] 🔧 Normalizing data structure...");
        const normalized: Overview = {
          chambers: data?.chambers ?? { active: 0, inactive: 0 },
          orders: data?.orders ?? { completed: 0, pending: 0 },
          products: data?.products ?? { pending: 0, approved: 0 },
          sellerApplications: data?.sellerApplications ?? {
            pending: 0,
            approved: 0,
          },
        };

        console.log(
          "[debug:fetchOverview] ✅ Normalized data:",
          JSON.stringify(normalized, null, 2)
        );
        console.log(
          "[debug:fetchOverview] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)"
        );
        console.log("[debug:fetchOverview] 💾 Setting state with real data...");

        set({
          overview: normalized,
          loading: { ...get().loading, overview: false },
        });

        console.log(
          "[debug:fetchOverview] ✅ State updated successfully with REAL API DATA"
        );
        console.log("========================================\n");
      } catch (err) {
        console.error("\n❌❌❌ [debug:fetchOverview] ERROR CAUGHT ❌❌❌");
        console.error("[debug:fetchOverview] Error object:", err);
        console.error(
          "[debug:fetchOverview] Error message:",
          (err as Error).message
        );
        console.error(
          "[debug:fetchOverview] Error stack:",
          (err as Error).stack
        );

        // Check if it's an axios error with response
        const axiosError = err as any;
        if (axiosError.response) {
          console.error("[debug:fetchOverview] 🔴 HTTP Error Response:");
          console.error(
            "[debug:fetchOverview]   Status:",
            axiosError.response.status
          );
          console.error(
            "[debug:fetchOverview]   Status Text:",
            axiosError.response.statusText
          );
          console.error(
            "[debug:fetchOverview]   Headers:",
            axiosError.response.headers
          );
          console.error(
            "[debug:fetchOverview]   Data:",
            JSON.stringify(axiosError.response.data, null, 2)
          );

          if (axiosError.response.status === 401) {
            console.error(
              "[debug:fetchOverview] ⚠️ 401 Unauthorized - Token may be invalid or expired"
            );
            console.error(
              "[debug:fetchOverview] ⚠️ Refresh attempt may have failed"
            );
          }
        } else if (axiosError.request) {
          console.error(
            "[debug:fetchOverview] 🔴 Network Error - No response received"
          );
          console.error("[debug:fetchOverview]   Request:", axiosError.request);
        } else {
          console.error(
            "[debug:fetchOverview] 🔴 Error setting up request:",
            axiosError.message
          );
        }

        // api interceptor already handled 401 with refresh attempt
        // If we still get an error here, it means refresh failed or other error
        const errorMessage =
          (err as Error).message || "Failed to fetch overview";

        console.error(
          "[debug:fetchOverview] 💾 Setting error state:",
          errorMessage
        );
        console.error(
          "[debug:fetchOverview] 🎯 DATA SOURCE: ERROR - NO DATA SET"
        );
        console.error("========================================\n");

        set({
          error: { ...get().error, overview: errorMessage },
          loading: { ...get().loading, overview: false },
        });
      }
    },

    fetchSales: async (days: number = 7) => {
      console.log("\n========================================");
      console.log(`[debug:fetchSales] 🚀 STARTING fetchSales (days=${days})`);
      console.log("========================================");

      const token = getAccessToken();
      console.log("[debug:fetchSales] 🔐 Token status:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
      });

      set({
        loading: { ...get().loading, sales: true },
        error: { ...get().error, sales: null },
      });
      try {
        console.log(`[debug:fetchSales] 📡 API call details:`);
        console.log(
          `[debug:fetchSales] 📍 Endpoint: v1/super-admin/dashboard/sales`
        );
        console.log(`[debug:fetchSales] 🔧 Method: GET`);
        console.log(`[debug:fetchSales] 📋 Params: { days: ${days} }`);
        console.log(`[debug:fetchSales] ⏳ Sending request...`);

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/super-admin/dashboard/sales`, {
          params: { days },
        });

        console.log("[debug:fetchSales] ✅ API call completed");
        console.log("[debug:fetchSales] 📥 Response status:", res.status);

        // API may return wrapped payload: { success, statusCode, data: { labels: [...], values: [...] } }
        const payload = res.data as Record<string, unknown>;
        console.log(
          "[debug:fetchSales] 📦 Response payload:",
          JSON.stringify(payload, null, 2)
        );

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

        console.log("[debug:fetchSales] 📊 Parsed sales data:", mapped);
        console.log(
          "[debug:fetchSales] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)"
        );
        console.log("[debug:fetchSales] 💾 Setting state with real data...");

        set({ sales: mapped, loading: { ...get().loading, sales: false } });

        console.log("[debug:fetchSales] ✅ State updated with REAL API DATA");
        console.log("========================================\n");
      } catch (err) {
        console.error("\n❌❌❌ [debug:fetchSales] ERROR CAUGHT ❌❌❌");
        console.error("[debug:fetchSales] Error:", err);

        const axiosError = err as any;
        if (axiosError.response) {
          console.error("[debug:fetchSales] HTTP Error:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          });
        }

        const errorMessage =
          (err as Error).message || "Failed to fetch sales data";

        console.error(
          "[debug:fetchSales] 💾 Setting error state:",
          errorMessage
        );
        console.error("========================================\n");

        set({
          error: { ...get().error, sales: errorMessage },
          loading: { ...get().loading, sales: false },
        });
      }
    },

    fetchChambers: async (page: number = 1, limit: number = 10) => {
      console.log("\n========================================");
      console.log(
        `[debug:fetchChambers] 🚀 STARTING fetchChambers (page=${page}, limit=${limit})`
      );
      console.log("========================================");

      const token = getAccessToken();
      console.log("[debug:fetchChambers] 🔐 Token status:", {
        hasToken: !!token,
      });

      set({
        loading: { ...get().loading, chambers: true },
        error: { ...get().error, chambers: null },
      });

      try {
        console.log(`[debug:fetchChambers] 📡 API call details:`);
        console.log(
          `[debug:fetchChambers] 📍 Endpoint: v1/super-admin/dashboard/chambers`
        );
        console.log(
          `[debug:fetchChambers] 📋 Params: { page: ${page}, limit: ${limit} }`
        );
        console.log(`[debug:fetchChambers] ⏳ Sending request...`);

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/super-admin/dashboard/chambers`, {
          params: { page, limit },
        });

        console.log("[debug:fetchChambers] ✅ API call completed");
        console.log("[debug:fetchChambers] 📥 Response status:", res.status);

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

        console.log(
          "[debug:fetchChambers] 📊 Parsed chamber data:",
          JSON.stringify(chamberRegistry, null, 2)
        );
        console.log(
          "[debug:fetchChambers] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)"
        );
        console.log("[debug:fetchChambers] 💾 Setting state with real data...");

        set({
          chambers: chamberRegistry,
          loading: { ...get().loading, chambers: false },
        });

        console.log(
          "[debug:fetchChambers] ✅ State updated with REAL API DATA"
        );
        console.log("========================================\n");
      } catch (err) {
        console.error("\n❌❌❌ [debug:fetchChambers] ERROR CAUGHT ❌❌❌");
        console.error("[debug:fetchChambers] Error:", err);

        const axiosError = err as any;
        if (axiosError.response) {
          console.error("[debug:fetchChambers] HTTP Error:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          });
        }

        const errorMessage =
          (err as Error).message || "Failed to fetch chambers";
        console.error(
          "[debug:fetchChambers] 💾 Setting error state:",
          errorMessage
        );
        console.error("========================================\n");

        set({
          error: { ...get().error, chambers: errorMessage },
          loading: { ...get().loading, chambers: false },
        });
      }
    },

    fetchUsersStats: async () => {
      console.log("\n========================================");
      console.log("[debug:fetchUsersStats] 🚀 STARTING fetchUsersStats");
      console.log("========================================");

      const token = getAccessToken();
      console.log("[debug:fetchUsersStats] 🔐 Token status:", {
        hasToken: !!token,
      });

      set({
        loading: { ...get().loading, usersStats: true },
        error: { ...get().error, usersStats: null },
      });
      try {
        console.log("[debug:fetchUsersStats] 📡 API call details:");
        console.log(
          "[debug:fetchUsersStats] 📍 Endpoint: v1/super-admin/dashboard/users-stats"
        );
        console.log("[debug:fetchUsersStats] ⏳ Sending request...");

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/super-admin/dashboard/users-stats`);

        console.log("[debug:fetchUsersStats] ✅ API call completed");
        console.log("[debug:fetchUsersStats] 📥 Response status:", res.status);

        // API returns: { success, statusCode, data: { USER: 1, BUYER: 5, ... } }
        const payload = res.data as Record<string, unknown>;
        console.log(
          "[debug:fetchUsersStats] 📦 Response payload:",
          JSON.stringify(payload, null, 2)
        );

        const data: UsersStats = (payload?.data as UsersStats) || {};
        console.log("[debug:fetchUsersStats] 📊 Extracted user stats:", data);
        console.log(
          "[debug:fetchUsersStats] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)"
        );

        set({
          usersStats: data,
          loading: { ...get().loading, usersStats: false },
        });

        console.log(
          "[debug:fetchUsersStats] ✅ State updated with REAL API DATA"
        );
        console.log("========================================\n");
      } catch (err) {
        console.error("\n❌❌❌ [debug:fetchUsersStats] ERROR CAUGHT ❌❌❌");
        console.error("[debug:fetchUsersStats] Error:", err);

        const axiosError = err as any;
        if (axiosError.response) {
          console.error("[debug:fetchUsersStats] HTTP Error:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          });
        }

        const errorMessage =
          (err as Error).message || "Failed to fetch user statistics";
        console.error(
          "[debug:fetchUsersStats] 💾 Setting error state:",
          errorMessage
        );
        console.error("========================================\n");

        set({
          error: { ...get().error, usersStats: errorMessage },
          loading: { ...get().loading, usersStats: false },
        });
      }
    },

    fetchUsers: async (page: number = 1, limit: number = 50) => {
      console.log("\n========================================");
      console.log(
        `[debug:fetchUsers] 🚀 STARTING fetchUsers (page=${page}, limit=${limit})`
      );
      console.log("========================================");

      const token = getAccessToken();
      console.log("[debug:fetchUsers] 🔐 Token status:", { hasToken: !!token });

      set({
        loading: { ...get().loading, users: true },
        error: { ...get().error, users: null },
      });

      try {
        console.log(`[debug:fetchUsers] 📡 API call details:`);
        console.log(`[debug:fetchUsers] 📍 Endpoint: v1/users`);
        console.log(
          `[debug:fetchUsers] 📋 Params: { page: ${page}, limit: ${limit} }`
        );
        console.log(`[debug:fetchUsers] ⏳ Sending request...`);

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/users`, { params: { page, limit } });

        console.log("[debug:fetchUsers] ✅ API call completed");
        console.log("[debug:fetchUsers] 📥 Response status:", res.status);
        console.log(
          "[debug:fetchUsers] 📦 Response payload:",
          JSON.stringify(res.data, null, 2)
        );

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

        console.log(
          "[debug:fetchUsers] 📊 Parsed users data:",
          `${mapped.length} users`
        );
        console.log(
          "[debug:fetchUsers] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)"
        );
        console.log("[debug:fetchUsers] 💾 Setting state with real data...");

        set({ users: mapped, loading: { ...get().loading, users: false } });

        console.log("[debug:fetchUsers] ✅ State updated with REAL API DATA");
        console.log("========================================\n");
      } catch (err) {
        console.error("\n❌❌❌ [debug:fetchUsers] ERROR CAUGHT ❌❌❌");
        console.error("[debug:fetchUsers] Error:", err);

        const axiosError = err as any;
        if (axiosError.response) {
          console.error("[debug:fetchUsers] HTTP Error:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          });
        }

        const errorMessage = (err as Error).message || "Failed to fetch users";
        console.error(
          "[debug:fetchUsers] 💾 Setting error state:",
          errorMessage
        );
        console.error("========================================\n");

        set({
          error: { ...get().error, users: errorMessage },
          loading: { ...get().loading, users: false },
        });
      }
    },

    fetchCards: async () => {
      console.log("\n========================================");
      console.log("[debug:fetchCards] 🚀 STARTING fetchCards");
      console.log("========================================");

      const token = getAccessToken();
      console.log("[debug:fetchCards] 🔐 Token status:", { hasToken: !!token });

      set({
        loading: { ...get().loading, cards: true },
        error: { ...get().error, cards: null },
      });
      try {
        console.log("[debug:fetchCards] 📡 API call details:");
        console.log(
          "[debug:fetchCards] 📍 Endpoint: v1/super-admin/dashboard/cards"
        );
        console.log("[debug:fetchCards] ⏳ Sending request...");

        // ✅ api instance handles token automatically
        const res = await api.get(`v1/super-admin/dashboard/cards`);

        console.log("[debug:fetchCards] ✅ API call completed");
        console.log("[debug:fetchCards] 📥 Response status:", res.status);
        console.log(
          "[debug:fetchCards] 📦 Response payload:",
          JSON.stringify(res.data, null, 2)
        );

        const data: CardsSummary = res.data;
        console.log("[debug:fetchCards] 📊 Parsed cards data:", data);
        console.log(
          "[debug:fetchCards] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)"
        );
        console.log("[debug:fetchCards] 💾 Setting state with real data...");

        set({ cards: data, loading: { ...get().loading, cards: false } });

        console.log("[debug:fetchCards] ✅ State updated with REAL API DATA");
        console.log("========================================\n");
      } catch (err) {
        console.error("\n❌❌❌ [debug:fetchCards] ERROR CAUGHT ❌❌❌");
        console.error("[debug:fetchCards] Error:", err);

        const axiosError = err as any;
        if (axiosError.response) {
          console.error("[debug:fetchCards] HTTP Error:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
          });
        }

        const errorMessage =
          (err as Error).message || "Failed to fetch summary cards";
        console.error(
          "[debug:fetchCards] 💾 Setting error state:",
          errorMessage
        );
        console.error("========================================\n");

        set({
          error: { ...get().error, cards: errorMessage },
          loading: { ...get().loading, cards: false },
        });
      }
    },
  }))
);
