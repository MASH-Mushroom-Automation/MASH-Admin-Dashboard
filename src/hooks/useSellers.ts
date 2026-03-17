
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
}, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...queryKeys.sellers.lists(), { ...params }],
    enabled,
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

      // Normalize possible wrapper structures
      // e.g. { success, data: { success, data: {...actual} } }
      if (payload?.data?.data) data = payload.data.data;
      else if (payload?.data) data = payload.data;
      else if (payload?.application) data = payload.application;
      else if (payload && !payload.success) data = payload;
      else data = payload;

      // Defensive unwrapping for odd nested responses
      if (
        data?.data &&
        !data?.user &&
        !data?.businessInfo &&
        !data?.businessName &&
        !data?.documents
      ) {
        data = data.data;
      }

      if (!data) throw new Error("Seller application not found");

      let userObj = data.user || data.userData || {};

      const pickFirst = (...values: any[]) => {
        for (const value of values) {
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value;
          }
        }
        return undefined;
      };

      const normalizeStringArray = (value: any): string[] => {
        if (Array.isArray(value)) {
          return value
            .map((item) => String(item ?? "").trim())
            .filter(Boolean);
        }
        if (typeof value === "string") {
          return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];
      };

      const normalizeDocValue = (value: any): string | undefined => {
        if (!value) return undefined;
        if (typeof value === "string") return value.trim() || undefined;
        if (Array.isArray(value)) {
          for (const item of value) {
            const normalized = normalizeDocValue(item);
            if (normalized) return normalized;
          }
          return undefined;
        }
        if (typeof value === "object") {
          return pickFirst(
            value.url,
            value.fileUrl,
            value.path,
            value.value,
            value.src,
            value.location,
          );
        }
        return undefined;
      };

      const businessInfoObj =
        data.businessInfo ||
        data.business_information ||
        data.businessDetails ||
        data.business ||
        {};

      const contactInfoObj = data.contactInfo || data.userInfo || data.contact || {};
      const productInfoObj = data.productInfo || data.product || {};

      const docsObj =
        data.documents ||
        data.businessDocuments ||
        data.document ||
        businessInfoObj.documents ||
        {};
      const docsArray = Array.isArray(docsObj)
        ? docsObj
        : [
          ...(Array.isArray(data.businessDocuments) ? data.businessDocuments : []),
          ...(Array.isArray(businessInfoObj.documents)
            ? businessInfoObj.documents
            : []),
          ...(Array.isArray(businessInfoObj.requirements)
            ? businessInfoObj.requirements
            : []),
        ];

      const getDocFromArray = (typeKeywords: string[]) => {
        const matched = docsArray.find((doc: any) => {
          const t = String(doc?.type || doc?.name || doc?.documentType || "").toLowerCase();
          return typeKeywords.some((k) => t.includes(k));
        });
        return pickFirst(
          normalizeDocValue(matched),
          normalizeDocValue(matched?.url),
          normalizeDocValue(matched?.fileUrl),
          normalizeDocValue(matched?.path),
          normalizeDocValue(matched?.value),
        );
      };

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
          governmentId: normalizeDocValue(
            pickFirst(
              docsObj?.governmentId,
              docsObj?.government_id,
              docsObj?.validId,
              docsObj?.valid_id,
              docsObj?.governmentIdUrl,
              docsObj?.id,
            ),
          ) ||
            getDocFromArray(["government", "valid id", "id"]),
          birCertificate: normalizeDocValue(
            pickFirst(
              docsObj?.birCertificate,
              docsObj?.bir_certificate,
              docsObj?.bir,
              docsObj?.birCertificateUrl,
            ),
          ) ||
            getDocFromArray(["bir"]),
          businessCertificate: normalizeDocValue(
            pickFirst(
              docsObj?.businessCertificate,
              docsObj?.business_certificate,
              docsObj?.dti,
              docsObj?.sec,
              docsObj?.businessCertificateUrl,
              docsObj?.permit,
            ),
          ) ||
            getDocFromArray(["business", "dti", "sec", "certificate"]),
          bankAccountDocumentation: normalizeDocValue(
            pickFirst(
              docsObj?.bankAccountDocumentation,
              docsObj?.bank_account_documentation,
              docsObj?.bankDocument,
              docsObj?.bank,
            ),
          ) ||
            getDocFromArray(["bank", "account"]),
        },
        businessInfo: {
          businessName: pickFirst(
            businessInfoObj?.businessName,
            businessInfoObj?.name,
            data.businessName,
            data.storeName,
          ),
          businessType: pickFirst(
            businessInfoObj?.businessType,
            businessInfoObj?.type,
            data.businessType,
          ),
          taxIdNumber: pickFirst(
            businessInfoObj?.taxIdNumber,
            businessInfoObj?.taxId,
            data.taxIdNumber,
            data.taxId,
          ),
          additionalInfo: pickFirst(
            businessInfoObj?.additionalInfo,
            businessInfoObj?.description,
            data.additionalInfo,
            data.adminNotes,
          ),
          businessAddress: pickFirst(
            businessInfoObj?.businessAddress,
            businessInfoObj?.address,
            data.businessAddress,
            data.address,
          ),
        },
        contactInfo: {
          city: pickFirst(
            contactInfoObj?.city,
            userObj?.city,
            data.city,
          ),
          region: pickFirst(
            contactInfoObj?.region,
            userObj?.region,
            data.region,
          ),
          completeAddress: pickFirst(
            contactInfoObj?.completeAddress,
            contactInfoObj?.address,
            businessInfoObj?.businessAddress,
            data.completeAddress,
            data.address,
          ),
        },
        productInfo: {
          typesOfMushrooms: normalizeStringArray(
            pickFirst(
              productInfoObj?.typesOfMushrooms,
              productInfoObj?.mushroomTypes,
              productInfoObj?.typesOfMushroom,
              data.typesOfMushrooms,
              data.mushroomTypes,
              data.typesOfMushroom,
            ),
          ),
          monthlyProductionCapacity: pickFirst(
            productInfoObj?.monthlyProductionCapacity,
            productInfoObj?.capacity,
            data.monthlyProductionCapacity,
          ),
          certifications: normalizeStringArray(
            pickFirst(
              productInfoObj?.certifications,
              data.certifications,
            ),
          ),
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
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
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
