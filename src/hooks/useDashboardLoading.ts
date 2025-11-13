import { useDashboardStore } from "../store/dashboardStore";

export function useDashboardLoading() {
  const { loading } = useDashboardStore();

  // Only check loading states for dashboard page calls
  const relevantKeys = [
    "overview",
    "sales",
    "chambers",
    "usersStats",
    "users",
    "cards",
  ];

  return relevantKeys.some((key) => loading[key] === true);
}
