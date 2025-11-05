// hooks/useDashboardData.ts
import { useEffect } from "react";
import { useDashboardStore } from "../store/dashboardStore";

export const useDashboardData = () => {
  const {
    fetchOverview,
    fetchSales,
    fetchChambers,
    fetchUsersStats,
    fetchCards,
    loading,
  } = useDashboardStore();

  useEffect(() => {
    fetchOverview();
    fetchSales(7);
    fetchChambers(1, 10);
    fetchUsersStats();
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return { loading };
};
