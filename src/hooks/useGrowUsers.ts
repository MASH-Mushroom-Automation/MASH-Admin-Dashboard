import { useQuery } from "@tanstack/react-query";
import { growUserService } from "@/services/mashGrowService";
import { queryKeys } from "@/lib/query-keys";

export function useGrowUsers(options?: {
  archived?: boolean;
  hasDevice?: boolean;
}, enabled: boolean = true) {
  return useQuery({
    queryKey: ["grow-users", { ...options }],
    enabled,
    queryFn: async () => {
      const response = await growUserService.getAll({
        limit: 1000,
        archived: options?.archived,
        hasDevice: options?.hasDevice,
      });

      return (response.data || []).map((u: any) => ({
        id: u.id,
        name:
          u.firstName && u.lastName
            ? `${u.firstName} ${u.lastName}`
            : u.username || u.email || "Unknown",
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        contactNumber: u.phone || u.phoneNumber || "",
        phoneNumber: u.phone || u.phoneNumber || "",
        address: u.address || "",
        deviceId: u.devices?.[0]?.serialNumber || "",
        chamberNumber:
          u.devices?.[0]?.name ||
          (u.devices?.length ? `Device ${u.devices.length}` : "—"),
        archived: !u.isActive,
        createdAt: u.createdAt,
        role: u.role,
      }));
    },
  });
}
