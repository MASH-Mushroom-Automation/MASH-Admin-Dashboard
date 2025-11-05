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

interface DashboardState {
  overview: Overview | null;
  sales: DailySale[] | null;
  chambers: ChamberRegistry | null;
  usersStats: UsersStats | null;
  cards: CardsSummary | null;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchOverview: () => Promise<void>;
  fetchSales: (days: number) => Promise<void>;
  fetchChambers: (page: number, limit: number) => Promise<void>;
  fetchUsersStats: () => Promise<void>;
  fetchCards: () => Promise<void>;
}

// Using axios baseURL (includes /api/v1)
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => ({
    overview: null,
    sales: null,
    chambers: null,
    usersStats: null,
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

        const data: Overview = res.data;
        set({ overview: data, loading: { ...get().loading, overview: false } });
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
        const res = await api.get(`v1/super-admin/dashboard/sales`, {
          params: { days },
        });

        // API may return wrapped payload: { success, statusCode, data: { labels: [...], values: [...] } }
        const payload = res.data as any;

        let mapped: DailySale[] = [];

        if (Array.isArray(payload)) {
          // legacy: array of { day, sales }
          mapped = payload as DailySale[];
        } else if (payload?.data?.labels && payload?.data?.values) {
          const labels: string[] = payload.data.labels || [];
          const values: number[] = payload.data.values || [];
          mapped = labels.map((lbl, idx) => ({
            day: lbl,
            sales: Number(values[idx] ?? 0),
          }));
        } else if (Array.isArray(payload?.data)) {
          // sometimes data is already an array of objects
          mapped = payload.data as DailySale[];
        } else {
          // fallback: try using payload directly if it matches
          mapped = (payload as any) ?? [];
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
        const res = await api.get(`v1/super-admin/dashboard/chambers`, {
          params: { page, limit },
        });

        // The API response is wrapped. Example shape:
        // { success, statusCode, data: { data: [ ...items ], meta: { total, page, limit } } }
        const payload = res.data as any;
        const items = (payload?.data?.data || []) as any[];
        const meta = payload?.data?.meta || {};

        // Map API fields to internal Chamber type
        const mapped: Chamber[] = items.map((it) => ({
          id: it.chamberId ?? it.id ?? "",
          grower: it.growerName ?? it.grower ?? "",
          location: it.location ?? "",
          status: it.status ?? "",
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
        const res = await api.get(`v1/super-admin/dashboard/users-stats`);

        // API returns: { success, statusCode, data: { USER: 1, BUYER: 5, ... } }
        const payload = res.data as any;
        const data: UsersStats = payload?.data || {};

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
        set({
          error: { ...get().error, cards: (err as Error).message },
          loading: { ...get().loading, cards: false },
        });
      }
    },
  }))
);
