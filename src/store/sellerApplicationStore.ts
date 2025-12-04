// src/store/sellerApplicationStore.ts
/**
 * Seller Application Store - Handles seller application requests and processing
 *
 * SECURITY ARCHITECTURE:
 * ✅ Access Token: Stored in memory via tokenManager (XSS protection)
 * ✅ Refresh Token: HttpOnly cookie (automatic, XSS protection)
 * ✅ All API calls use `api` instance which automatically:
 *    - Adds Authorization: Bearer {accessToken} header
 *    - Includes credentials: "include" for refresh cookie
 *    - Handles 401 errors with automatic token refresh + retry
 *
 * See SECURE_TOKEN_IMPLEMENTATION.md for complete documentation.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { api } from "@/lib/api";

// Seller application list item interface (from /api/v1/super-admin/seller-applications/pending)
export interface SellerApplication {
  requestId: string;
  userId: string;
  sellerName: string; // Combined firstName + lastName from user object
  storeName?: string; // May not be in the response yet
  email: string;
  address?: string; // May not be in the response yet
  currentRole: string;
  requestedRole: string;
  queuedAt: string;
  priority: number;
  isApproved: boolean; // Derived from status or explicitly returned
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    imageUrl?: string;
    createdAt: string;
  };
}

// Detailed seller application interface (from /api/v1/super-admin/seller-applications/:requestId)
export interface SellerApplicationDetail {
  requestId: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    imageUrl?: string;
    createdAt: string;
  };
  currentRole: string;
  requestedRole: string;
  documents: {
    governmentId?: string;
    birCertificate?: string;
    businessCertificate?: string;
    bankAccountDocumentation?: string;
  };
  businessInfo: {
    businessName?: string;
    additionalInfo?: string;
    businessAddress?: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  queuedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  adminNotes?: string | null;
  priority: number;
}

interface SellerApplicationState {
  applications: SellerApplication[] | null;
  selectedApplication: SellerApplicationDetail | null;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchPendingApplications: () => Promise<void>;
  fetchApplicationById: (requestId: string) => Promise<void>;
  approveApplication: (requestId: string) => Promise<void>;
  rejectApplication: (requestId: string, reason?: string) => Promise<void>;
  clearSelectedApplication: () => void;
}

export const useSellerApplicationStore = create<SellerApplicationState>()(
  devtools((set, get) => ({
    applications: null,
    selectedApplication: null,
    loading: {},
    error: {},

    fetchPendingApplications: async () => {
      console.log("[sellerApplicationStore] fetchPendingApplications called");

      if (typeof window !== "undefined") {
        console.log(
          "[sellerApplicationStore] 🔐 Fetching pending seller applications (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, applications: true },
        error: { ...get().error, applications: null },
      });

      try {
        console.log(
          "[sellerApplicationStore] Fetching from API: v1/super-admin/seller-applications/pending"
        );
        const res = await api.get("v1/super-admin/seller-applications/pending");
        console.log(
          "[sellerApplicationStore] API response received:",
          res.data
        );

        // Normalize possible response shapes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;
        console.log(
          "[sellerApplicationStore] Payload type:",
          Array.isArray(payload) ? "array" : typeof payload
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let items: any[] = [];

        if (Array.isArray(payload)) {
          console.log(
            "[sellerApplicationStore] Payload is array, length:",
            payload.length
          );
          items = payload;
        } else if (payload?.data) {
          if (Array.isArray(payload.data)) {
            console.log(
              "[sellerApplicationStore] payload.data is array, length:",
              payload.data.length
            );
            items = payload.data;
          } else if (Array.isArray(payload.data?.data)) {
            console.log(
              "[sellerApplicationStore] payload.data.data is array, length:",
              payload.data.data.length
            );
            items = payload.data.data;
          }
        } else if (typeof payload === "object") {
          items =
            payload.applications || payload.sellers || payload.items || [];
          console.log(
            "[sellerApplicationStore] Extracted items from object wrapper, length:",
            items.length
          );
        }

        console.log(
          "[sellerApplicationStore] Raw items before mapping:",
          items
        );

        // Log first application's raw data to see available fields
        if (items.length > 0) {
          console.log(
            "[sellerApplicationStore] Sample raw seller application:",
            items[0]
          );
          console.log(
            "[sellerApplicationStore] Available keys in raw application:",
            Object.keys(items[0])
          );
        }

        const mapped: SellerApplication[] = (items || []).map((app) => {
          const user = app.user || {};
          const sellerName =
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.username ||
            "Unknown";

          return {
            requestId: String(app.requestId ?? ""),
            userId: String(app.userId ?? user.id ?? ""),
            sellerName,
            storeName: app.storeName ?? undefined, // Not in current API response
            email: String(user.email ?? app.email ?? ""),
            address: app.address ?? undefined, // Not in current API response
            currentRole: String(app.currentRole ?? user.role ?? ""),
            requestedRole: String(app.requestedRole ?? ""),
            queuedAt: String(app.queuedAt ?? ""),
            priority: Number(app.priority ?? 0),
            isApproved: app.isApproved ?? false,
            user: {
              id: String(user.id ?? ""),
              email: String(user.email ?? ""),
              username: String(user.username ?? ""),
              firstName: String(user.firstName ?? ""),
              lastName: String(user.lastName ?? ""),
              role: String(user.role ?? ""),
              imageUrl: user.imageUrl ?? undefined,
              createdAt: String(user.createdAt ?? ""),
            },
          };
        });

        console.log(
          "[sellerApplicationStore] Mapped seller applications:",
          mapped
        );
        console.log(
          "[sellerApplicationStore] Total applications fetched:",
          mapped.length
        );

        set({
          applications: mapped,
          loading: { ...get().loading, applications: false },
        });
      } catch (err) {
        const errorMessage =
          (err as Error).message ||
          "Failed to fetch pending seller applications";
        console.error(
          "[sellerApplicationStore] fetchPendingApplications error:",
          {
            message: errorMessage,
            error: err,
          }
        );

        set({
          error: { ...get().error, applications: errorMessage },
          loading: { ...get().loading, applications: false },
        });
      }
    },

    fetchApplicationById: async (requestId: string) => {
      console.log(
        "[sellerApplicationStore] fetchApplicationById called with requestId:",
        requestId
      );

      if (!requestId) {
        console.error("[sellerApplicationStore] Invalid requestId provided");
        set({
          error: {
            ...get().error,
            selectedApplication: "Invalid request ID",
          },
        });
        return;
      }

      if (typeof window !== "undefined") {
        console.log(
          "[sellerApplicationStore] 🔐 Fetching seller application details (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, selectedApplication: true },
        error: { ...get().error, selectedApplication: null },
      });

      try {
        console.log(
          `[sellerApplicationStore] Fetching from API: v1/super-admin/seller-applications/${requestId}`
        );
        const res = await api.get(
          `v1/super-admin/seller-applications/${requestId}`
        );
        console.log(
          "[sellerApplicationStore] API response received:",
          res.data
        );

        // Normalize response shape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;

        // Extract application data from possible wrapper structures
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let appData: any = null;

        if (payload?.data) {
          appData = payload.data;
        } else if (payload?.application) {
          appData = payload.application;
        } else {
          appData = payload;
        }

        console.log(
          "[sellerApplicationStore] Extracted application data:",
          appData
        );
        console.log(
          "[sellerApplicationStore] Available keys:",
          Object.keys(appData || {})
        );

        if (!appData) {
          throw new Error("Application data not found in response");
        }

        // Map to SellerApplicationDetail interface
        const mappedApplication: SellerApplicationDetail = {
          requestId: String(appData.requestId ?? ""),
          user: {
            id: String(appData.user?.id ?? ""),
            email: String(appData.user?.email ?? ""),
            username: String(appData.user?.username ?? ""),
            firstName: String(appData.user?.firstName ?? ""),
            lastName: String(appData.user?.lastName ?? ""),
            role: String(appData.user?.role ?? ""),
            imageUrl: appData.user?.imageUrl ?? undefined,
            createdAt: String(appData.user?.createdAt ?? ""),
          },
          currentRole: String(appData.currentRole ?? ""),
          requestedRole: String(appData.requestedRole ?? ""),
          documents: {
            governmentId: appData.documents?.governmentId ?? undefined,
            birCertificate: appData.documents?.birCertificate ?? undefined,
            businessCertificate:
              appData.documents?.businessCertificate ?? undefined,
            bankAccountDocumentation:
              appData.documents?.bankAccountDocumentation ?? undefined,
          },
          businessInfo: {
            businessName: appData.businessInfo?.businessName ?? undefined,
            additionalInfo: appData.businessInfo?.additionalInfo ?? undefined,
            businessAddress: appData.businessInfo?.businessAddress ?? undefined,
          },
          status: appData.status ?? "PENDING",
          queuedAt: String(appData.queuedAt ?? ""),
          processedAt: appData.processedAt ?? null,
          completedAt: appData.completedAt ?? null,
          errorMessage: appData.errorMessage ?? null,
          adminNotes: appData.adminNotes ?? null,
          priority: Number(appData.priority ?? 0),
        };

        console.log(
          "[sellerApplicationStore] Mapped seller application detail:",
          mappedApplication
        );

        set({
          selectedApplication: mappedApplication,
          loading: { ...get().loading, selectedApplication: false },
        });
      } catch (err) {
        const errorMessage =
          (err as Error).message ||
          "Failed to fetch seller application details";
        console.error("[sellerApplicationStore] fetchApplicationById error:", {
          message: errorMessage,
          error: err,
        });

        set({
          error: { ...get().error, selectedApplication: errorMessage },
          loading: { ...get().loading, selectedApplication: false },
        });
      }
    },

    approveApplication: async (requestId: string) => {
      console.log(
        "[sellerApplicationStore] approveApplication called with requestId:",
        requestId
      );

      if (!requestId) {
        console.error("[sellerApplicationStore] Invalid requestId provided");
        throw new Error("Invalid request ID");
      }

      if (typeof window !== "undefined") {
        console.log(
          "[sellerApplicationStore] 🔐 Approving seller application (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, approveApplication: true },
        error: { ...get().error, approveApplication: null },
      });

      try {
        console.log(
          `[sellerApplicationStore] Approving application via API: PUT v1/super-admin/seller-applications/${requestId}/approve`
        );
        const res = await api.put(
          `v1/super-admin/seller-applications/${requestId}/approve`
        );
        console.log("[sellerApplicationStore] Approve API response:", res.data);

        // Update the application in the list if it exists
        const currentApplications = get().applications;
        if (currentApplications) {
          const updatedApplications = currentApplications.filter(
            (app) => app.requestId !== requestId
          );
          console.log(
            `[sellerApplicationStore] Removed approved application ${requestId} from pending list`
          );
          set({ applications: updatedApplications });
        }

        // Update selected application if it's the one that was approved
        if (get().selectedApplication?.requestId === requestId) {
          console.log(
            "[sellerApplicationStore] Updating selected application status to APPROVED"
          );
          set({
            selectedApplication: {
              ...get().selectedApplication!,
              status: "APPROVED",
              processedAt: new Date().toISOString(),
            },
          });
        }

        set({
          loading: { ...get().loading, approveApplication: false },
        });

        console.log(
          "[sellerApplicationStore] Application approved successfully"
        );
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Failed to approve seller application";
        console.error("[sellerApplicationStore] approveApplication error:", {
          message: errorMessage,
          error: err,
        });

        set({
          error: { ...get().error, approveApplication: errorMessage },
          loading: { ...get().loading, approveApplication: false },
        });

        throw new Error(errorMessage); // Re-throw for UI handling
      }
    },

    rejectApplication: async (requestId: string, reason?: string) => {
      console.log(
        "[sellerApplicationStore] rejectApplication called with requestId:",
        requestId,
        "reason:",
        reason
      );

      if (!requestId) {
        console.error("[sellerApplicationStore] Invalid requestId provided");
        throw new Error("Invalid request ID");
      }

      if (typeof window !== "undefined") {
        console.log(
          "[sellerApplicationStore] 🔐 Rejecting seller application (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, rejectApplication: true },
        error: { ...get().error, rejectApplication: null },
      });

      try {
        console.log(
          `[sellerApplicationStore] Rejecting application via API: PUT v1/super-admin/seller-applications/${requestId}/reject`
        );

        // Send rejection reason in request body if provided
        const res = await api.put(
          `v1/super-admin/seller-applications/${requestId}/reject`,
          reason ? { reason } : {}
        );
        console.log("[sellerApplicationStore] Reject API response:", res.data);

        // Update the application in the list if it exists
        const currentApplications = get().applications;
        if (currentApplications) {
          const updatedApplications = currentApplications.filter(
            (app) => app.requestId !== requestId
          );
          console.log(
            `[sellerApplicationStore] Removed rejected application ${requestId} from pending list`
          );
          set({ applications: updatedApplications });
        }

        // Update selected application if it's the one that was rejected
        if (get().selectedApplication?.requestId === requestId) {
          console.log(
            "[sellerApplicationStore] Updating selected application status to REJECTED"
          );
          set({
            selectedApplication: {
              ...get().selectedApplication!,
              status: "REJECTED",
              processedAt: new Date().toISOString(),
              adminNotes: reason || null,
            },
          });
        }

        set({
          loading: { ...get().loading, rejectApplication: false },
        });

        console.log(
          "[sellerApplicationStore] Application rejected successfully"
        );
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Failed to reject seller application";
        console.error("[sellerApplicationStore] rejectApplication error:", {
          message: errorMessage,
          error: err,
        });

        set({
          error: { ...get().error, rejectApplication: errorMessage },
          loading: { ...get().loading, rejectApplication: false },
        });

        throw new Error(errorMessage); // Re-throw for UI handling
      }
    },

    clearSelectedApplication: () => {
      console.log(
        "[sellerApplicationStore] Clearing selected seller application"
      );
      set({ selectedApplication: null });
    },
  }))
);
