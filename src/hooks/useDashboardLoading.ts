import { useDashboardStore } from "../store/dashboardStore";

export function useDashboardLoading() {
  const { loading } = useDashboardStore();
  return Object.values(loading).some(Boolean);
}
