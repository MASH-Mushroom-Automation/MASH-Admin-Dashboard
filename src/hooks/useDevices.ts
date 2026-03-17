import { useQuery } from "@tanstack/react-query";
import { deviceService } from "@/services/mashGrowService";
import { queryKeys } from "@/lib/query-keys";

export function useDevices(options?: { archived?: boolean }) {
  return useQuery({
    queryKey: queryKeys.devices.list({ archived: options?.archived }),
    queryFn: async () => {
      const response = await deviceService.getAll({
        page: 1,
        limit: 100, // Client side filtering
        archived: options?.archived,
      });

      return response.data.map((d) => ({
        ...d,
        model: d.type || "Standard Device",
        archived: !d.isActive,
      }));
    },
  });
}
