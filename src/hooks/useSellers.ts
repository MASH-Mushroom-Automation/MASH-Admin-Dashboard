 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { getCsrfToken } from "@/lib/csrfService";
import {
  SellerApplication,
  SellerApplicationDetail,
} from "@/store/sellerApplicationStore";

export const useSellers = (params?: {
  status?: "PENDING" | "COMPLETED" | "FAILED" | "PROCESSING" | "EXPIRED";
  userId?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.sellers.lists(), { ...params }],
    queryFn: async () => {
      const endpoint =
        params?.status === "PENDING" && !params?.userId
          ? "v1/super-admin/seller-applications/pending"
          : "v1/super-admin/seller-applications/all";

      const res = await api.get(endpoint, { params });
      const payload: any = res.data;
      let items: any[] = [];

      if (Array.isArray(payload)) items = payload;
      else if (payload?.data) {
        if (Array.isArray(payload.data)) items = payload.data;
        else if (Array.isArray(payload.data?.data)) items = payload.data.data;
      } else if (typeof payload === "object") {
        items = payload.applications || payload.sellers || payload.items || [];
      }

      const mappedApplications: SellerApplication[] = items.map((app: any) => {
        const userObj = app.user || app.userData || {};
        const firstName = userObj.firstName || app.firstName || "";
        const lastName = userObj.lastName || app.lastName || "";
        const fullName =
          `${firstName} ${lastName}`.trim() ||
          userObj.username ||
          app.username ||
          "Unknown Seller";

        return {
          requestId: String(app.id || app.requestId || app._id || ""),
          userId: String(app.userId || userObj.id || userObj._id || ""),
          sellerName: fullName,
          storeName: app.businessInfo?.businessName || app.storeName || "",
          email: userObj.email || app.email || "",
          address:
            app.businessInfo?.businessAddress ||
            app.address ||
            userObj.location ||
            "",
          currentRole: app.currentRole || userObj.role || "USER",
          requestedRole: app.requestedRole || "SELLER",
          queuedAt: app.queuedAt || app.createdAt || new Date().toISOString(),
          priority: Number(app.priority ?? 1),
          isApproved: app.status === "COMPLETED" || app.isApproved === true,
          status: app.status || (app.isApproved ? "COMPLETED" : "PENDING"),
          user: {
            id: String(userObj.id || userObj._id || ""),
            email: userObj.email || app.email || "",
            username: userObj.username || app.username || "",
            firstName,
            lastName,
            role: userObj.role || app.currentRole || "USER",
            imageUrl: userObj.imageUrl || userObj.avatar || app.avatar,
            createdAt:
              userObj.createdAt || app.createdAt || new Date().toISOString(),
          },
        };
      });

      return mappedApplications;
    },
  });
};

export const useSellerById = (requestId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.sellers.detail(requestId),
    queryFn: async () => {
      if (!requestId) throw new Error("Request ID is required");
      const res = await api.get(
        `v1/super-admin/seller-applications/${requestId}`,
      );

      const payload: any = res.data;
      let data: any = null;

      if (payload?.data) data = payload.data;
      else if (payload && !payload.success) data = payload;
      else data = payload;

      if (!data) throw new Error("Seller application not found");

      let userObj = data.user || data.userData || {};

      // Fallback to cache if user details are missing
      if (!userObj.firstName || !userObj.lastName || !userObj.email) {
        const cachedLists = queryClient.getQueriesData<any[]>({
          queryKey: queryKeys.sellers.lists(),
        });
        for (const [, cacheData] of cachedLists) {
          if (Array.isArray(cacheData)) {
            const found = cacheData.find(
              (app) =>
                String(app.requestId || app.id || app._id) ===
                String(requestId),
            );
            if (found && found.user) {
              userObj = { ...userObj, ...found.user };
              break;
            }
          }
        }
      }

      const firstName = userObj.firstName || data.firstName || "";
      const lastName = userObj.lastName || data.lastName || "";

      const mappedDetail: SellerApplicationDetail = {
        requestId: String(data.id || data.requestId || data._id || requestId),
        user: {
          id: String(userObj.id || userObj._id || ""),
          email: userObj.email || data.email || "",
          username: userObj.username || data.username || "",
          firstName,
          lastName,
          phoneNumber: userObj.phoneNumber || userObj.phone || data.phone,
          role: userObj.role || data.currentRole || "USER",
          imageUrl: userObj.imageUrl || userObj.avatar || data.avatar,
          createdAt:
            userObj.createdAt || data.createdAt || new Date().toISOString(),
        },
        currentRole: data.currentRole || userObj.role || "USER",
        requestedRole: data.requestedRole || "SELLER",
        documents: {
          governmentId: data.documents?.governmentId,
          birCertificate: data.documents?.birCertificate,
          businessCertificate: data.documents?.businessCertificate,
          bankAccountDocumentation: data.documents?.bankAccountDocumentation,
        },
        businessInfo: {
          businessName: data.businessInfo?.businessName || data.businessName,
          additionalInfo:
            data.businessInfo?.additionalInfo || data.additionalInfo,
          businessAddress:
            data.businessInfo?.businessAddress ||
            data.businessAddress ||
            data.address,
        },
        status: data.status || "PENDING",
        queuedAt: data.queuedAt || data.createdAt || new Date().toISOString(),
        processedAt: data.processedAt,
        completedAt: data.completedAt,
        errorMessage: data.errorMessage,
        adminNotes: data.adminNotes,
        priority: Number(data.priority ?? 1),
      };

      return mappedDetail;
    },
    enabled: !!requestId,
  });
};

export const useApproveSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      adminNotes,
    }: {
      requestId: string;
      adminNotes?: string;
    }) => {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) throw new Error("Missing CSRF token");
      const res = await api.put(
        `v1/super-admin/seller-applications/${requestId}/approve`,
        { adminNotes },
        { headers: { "x-csrf-token": csrfToken } },
      );
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.sellers.all }),
  });
};

export const useRejectSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason?: string;
    }) => {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) throw new Error("Missing CSRF token");
      const res = await api.put(
        `v1/super-admin/seller-applications/${requestId}/reject`,
        { reason },
        { headers: { "x-csrf-token": csrfToken } },
      );
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.sellers.all }),
  });
};
