 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { getCsrfToken } from "@/lib/csrfService";
import { UserItem, UserDetail } from "@/store/userManagementStore";

export const useUsers = (page: number = 1, limit: number = 100) => {
  return useQuery({
    queryKey: [...queryKeys.users.lists(), { page, limit }],
    queryFn: async () => {
      const res = await api.get(`v1/users`, { params: { page, limit } });
      const payload: any = res.data;
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
        items = payload.items || payload.users || [];
      }

      const mappedUsers: UserItem[] = items.map((u: any) => {
        const roleValue =
          u.role ?? u.userRole ?? u.type ?? u.accountType ?? "USER";

        // Ensure name isn't empty if we can avoid it
        let rawName =
          u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
        if (!rawName && u.profile) {
          rawName = [u.profile.firstName, u.profile.lastName]
            .filter(Boolean)
            .join(" ");
        }
        const finalName = rawName || u.username || u.userName || "Unknown";

        let region = u.region ?? u.location;
        if (!region && u.profile?.city) region = u.profile.city;
        if (!region) region = "N/A";

        return {
          id: String(u.id ?? u.userId ?? u._id ?? ""),
          name: finalName,
          username: u.username ?? u.userName ?? "",
          email: u.email ?? "",
          phone: u.phone ?? u.mobile ?? u.profile?.phone ?? "",
          role: roleValue,
          status: u.status ?? (u.isActive === false ? "Inactive" : "Active"),
          isActive: u.isActive !== undefined ? u.isActive : true,
          avatar: u.avatar ?? u.profile?.avatar ?? null,
          region,
        };
      });

      return mappedUsers;
    },
  });
};

export const useUserById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const res = await api.get(`v1/users/${id}`);
      const payload: any = res.data;
      let userData: any = null;

      if (payload?.data) {
        userData = payload.data;
      } else if (payload?.user) {
        userData = payload.user;
      } else if (payload && !payload.success) {
        userData = payload;
      } else {
        userData = payload;
      }

      if (!userData) throw new Error("User not found");

      const roleValue =
        userData.role ??
        userData.userRole ??
        userData.type ??
        userData.accountType ??
        "USER";

      let rawName =
        userData.name ??
        `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim();
      if (!rawName && userData.profile) {
        rawName = [userData.profile.firstName, userData.profile.lastName]
          .filter(Boolean)
          .join(" ");
      }
      const finalName =
        rawName || userData.username || userData.userName || "Unknown";

      let region = userData.region ?? userData.location;
      if (!region && userData.profile?.city) region = userData.profile.city;
      if (!region) region = "N/A";

      const detail: UserDetail = {
        id: String(userData.id ?? userData.userId ?? userData._id ?? id),
        name: finalName,
        username: userData.username ?? userData.userName ?? "",
        email: userData.email ?? "",
        phone:
          userData.phone ?? userData.mobile ?? userData.profile?.phone ?? "",
        role: roleValue,
        status:
          userData.status ??
          (userData.isActive === false ? "Inactive" : "Active"),
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        avatar: userData.avatar ?? userData.profile?.avatar ?? null,
        region,
        firstName: userData.firstName ?? userData.profile?.firstName,
        lastName: userData.lastName ?? userData.profile?.lastName,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        lastLogin: userData.lastLogin,
        verified: userData.verified ?? userData.isVerified ?? false,
        // Optional nested fields from API
        preferredPaymentMethod: userData.preferences?.paymentMethod,
        city: userData.profile?.city ?? userData.city,
        completeAddress: userData.profile?.address ?? userData.completeAddress,
      };
      return detail;
    },
    enabled: !!id,
  });
};

export const useArchiveUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      archive = true,
    }: {
      id: string;
      archive?: boolean;
    }) => {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error("Missing CSRF token");
      }

      const payload = { isActive: !archive };

      const res = await api.put(`v1/users/${id}/status`, payload, {
        headers: {
          "x-csrf-token": csrfToken,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
