/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

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

type UsersStats = Record<string, number>;

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: async () => {
      const res = await api.get(`v1/super-admin/dashboard/overview`);
      const payload = res.data as Record<string, unknown>;
      let data: Overview | null = null;

      if (
        payload?.data &&
        typeof payload.data === "object" &&
        "cards" in payload.data
      ) {
        data = (payload.data as any).cards;
      } else if (payload?.data) {
        data = payload.data as Overview;
      } else {
        data = payload as unknown as Overview;
      }

      const normalized: Overview = {
        chambers: data?.chambers ?? { active: 0, inactive: 0 },
        orders: data?.orders ?? { completed: 0, pending: 0 },
        products: data?.products ?? { pending: 0, approved: 0 },
        sellerApplications: data?.sellerApplications ?? {
          pending: 0,
          approved: 0,
        },
      };

      return normalized;
    },
  });
};

export const useDashboardSales = (days: number = 7) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, "sales", days],
    queryFn: async () => {
      const res = await api.get(`v1/super-admin/dashboard/sales`, {
        params: { days },
      });
      const payload = res.data as Record<string, unknown>;
      let mapped: DailySale[] = [];

      const formatDate = (dateString: string): string => {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;
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
          if (days <= 7) return `${dayNames[date.getDay()]} ${date.getDate()}`;
          else if (days <= 31)
            return `${monthNames[date.getMonth()]} ${date.getDate()}`;
          else return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        } catch {
          return dateString;
        }
      };

      if (Array.isArray(payload)) {
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
          mapped = (data as DailySale[]).map((item) => ({
            day: formatDate(item.day),
            sales: item.sales,
          }));
        }
      }
      return mapped;
    },
  });
};

export const useDashboardChambers = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, "chambers", page, limit],
    queryFn: async () => {
      const res = await api.get(`v1/super-admin/dashboard/chambers`, {
        params: { page, limit },
      });
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

      const mapped: Chamber[] = items.map((it) => ({
        id: String(it.chamberId ?? it.id ?? ""),
        grower: String(it.growerName ?? it.grower ?? ""),
        location: String(it.location ?? ""),
        status: String(it.status ?? ""),
      }));

      return {
        chambers: mapped,
        total: meta.total ?? mapped.length,
        page: meta.page ?? page,
        limit: meta.limit ?? limit,
      } as ChamberRegistry;
    },
  });
};

export const useDashboardUsersStats = () => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, "users"],
    queryFn: async () => {
      const res = await api.get(`v1/super-admin/dashboard/users-stats`);
      const payload = res.data as Record<string, unknown>;
      let data: UsersStats | null = null;
      if (
        payload?.data &&
        typeof payload.data === "object" &&
        "users" in payload.data
      ) {
        data = (payload.data as any).users as UsersStats;
      } else if (payload?.data) {
        data = payload.data as UsersStats;
      } else {
        data = payload as UsersStats;
      }
      return data;
    },
  });
};

export const useDashboardCards = () => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, "cards"],
    queryFn: async () => {
      const res = await api.get(`v1/super-admin/dashboard/overview`);
      const payload = res.data as Record<string, unknown>;
      let data: Record<string, unknown> | null = null;
      if (
        payload?.data &&
        typeof payload.data === "object" &&
        "cards" in payload.data
      ) {
        data = (payload.data as any).cards;
      } else if (payload?.data) {
        data = payload.data as Record<string, unknown>;
      } else {
        data = payload;
      }
      return {
        chambers: data?.chambers ?? { active: 0, inactive: 0 },
        orders: data?.orders ?? { completed: 0, pending: 0 },
        products: data?.products ?? { pending: 0, approved: 0 },
        sellerApplications: data?.sellerApplications ?? {
          pending: 0,
          approved: 0,
        },
      };
    },
  });
};
