import { useIsFetching } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardLoading() {
  const isFetchingDashboard = useIsFetching({ queryKey: ["dashboard"] });
  return isFetchingDashboard > 0;
}
