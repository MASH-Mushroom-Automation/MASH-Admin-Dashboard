// src/store/userManagementStore.ts
/**
 * User Management Store - Handles user-related data fetching and state
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
import { getCsrfToken } from "@/lib/csrfService";

// User item interface
export interface UserItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  avatar?: string;
  region?: string;
}

// Seller application interface (from /api/v1/super-admin/seller-applications/pending)
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

// Detailed user interface for single user fetch
export interface UserDetail extends UserItem {
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  verified?: boolean;
  // Customer-specific fields
  preferredPaymentMethod?: string;
  addressBook?: string[];
  city?: string;
  completeAddress?: string;
  // Seller-specific fields
  businessName?: string;
  businessAddress?: string;
  businessType?: string;
  taxId?: string;
  businessDocuments?: string[];
  // Product information
  typesOfMushroom?: string[];
  monthlyProductionCapacity?: string;
  certifications?: string[];
  // Banking details
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

interface UserManagementState {
  users: UserItem[] | null;
  selectedUser: UserDetail | null;
  sellerApplications: SellerApplication[] | null;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  fetchUserByUsername: (username: string) => Promise<void>;
  fetchPendingSellerApplications: () => Promise<void>;
  archiveUser: (id: string) => Promise<void>;
  clearSelectedUser: () => void;
}

export const useUserManagementStore = create<UserManagementState>()(
  devtools((set, get) => ({
    users: null,
    selectedUser: null,
    sellerApplications: null,
    loading: {},
    error: {},

    fetchUsers: async (page: number = 1, limit: number = 50) => {
      console.log("[userManagementStore] fetchUsers called with:", {
        page,
        limit,
      });

      if (typeof window !== "undefined") {
        console.log(
          "[userManagementStore] 🔐 Fetching users (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, users: true },
        error: { ...get().error, users: null },
      });

      try {
        console.log("[userManagementStore] Fetching users from API: v1/users");
        const res = await api.get(`v1/users`, { params: { page, limit } });
        console.log("[userManagementStore] API response received:", res.data);

        // Normalize possible response shapes:
        // 1) { success, statusCode, data: { data: [...], meta: { total, page, limit } } }
        // 2) { success, statusCode, data: [...] }
        // 3) Array of users or plain object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;
        console.log(
          "[userManagementStore] Payload type:",
          Array.isArray(payload) ? "array" : typeof payload
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let items: any[] = [];

        if (Array.isArray(payload)) {
          console.log(
            "[userManagementStore] Payload is array, length:",
            payload.length
          );
          items = payload;
        } else if (payload?.data) {
          if (Array.isArray(payload.data)) {
            console.log(
              "[userManagementStore] payload.data is array, length:",
              payload.data.length
            );
            items = payload.data;
          } else if (Array.isArray(payload.data?.data)) {
            console.log(
              "[userManagementStore] payload.data.data is array, length:",
              payload.data.data.length
            );
            items = payload.data.data;
          }
        } else if (typeof payload === "object") {
          // try to detect common wrapper
          items = payload.items || payload.users || [];
          console.log(
            "[userManagementStore] Extracted items from object wrapper, length:",
            items.length
          );
        }

        console.log("[userManagementStore] Raw items before mapping:", items);

        // Log first user's raw data to see available fields
        if (items.length > 0) {
          console.log(
            "[userManagementStore] Sample raw user object:",
            items[0]
          );
          console.log(
            "[userManagementStore] Available keys in raw user:",
            Object.keys(items[0])
          );
        }

        const mapped: UserItem[] = (items || []).map((u) => {
          // Try multiple possible role field names
          const roleValue =
            u.role ?? u.userRole ?? u.type ?? u.accountType ?? undefined;

          console.log(`[userManagementStore] Mapping user ${u.id}:`, {
            rawRole: u.role,
            rawUserRole: u.userRole,
            rawType: u.type,
            rawAccountType: u.accountType,
            finalRole: roleValue,
          });

          return {
            id: String(u.id ?? u.userId ?? u._id ?? ""),
            name: String(
              u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`
            ).trim(),
            username: u.username ?? u.userName ?? undefined,
            email: u.email ?? undefined,
            phone: u.phone ?? u.mobile ?? undefined,
            role: roleValue,
            status: u.status ?? undefined,
            isActive: u.isActive ?? undefined,
            avatar:
              u.avatar ??
              (u.name
                ? String(u.name)
                    .split(" ")
                    .map((s: string) => s[0])
                    .join("")
                    .slice(0, 2)
                : undefined),
            region: u.region ?? u.location ?? undefined,
          };
        });

        console.log("[userManagementStore] Mapped users:", mapped);
        console.log(
          "[userManagementStore] Total users fetched:",
          mapped.length
        );

        set({ users: mapped, loading: { ...get().loading, users: false } });
      } catch (err) {
        const errorMessage = (err as Error).message || "Failed to fetch users";
        console.error("[userManagementStore] fetchUsers error:", {
          message: errorMessage,
          error: err,
        });

        set({
          error: { ...get().error, users: errorMessage },
          loading: { ...get().loading, users: false },
        });
      }
    },

    fetchUserById: async (id: string) => {
      console.log("[userManagementStore] fetchUserById called with id:", id);

      if (!id) {
        console.error("[userManagementStore] Invalid user ID provided");
        set({
          error: { ...get().error, selectedUser: "Invalid user ID" },
        });
        return;
      }

      set({
        loading: { ...get().loading, selectedUser: true },
        error: { ...get().error, selectedUser: null },
      });

      try {
        console.log(
          `[userManagementStore] Fetching user from API: v1/users/${id}`
        );
        const res = await api.get(`v1/users/${id}`);
        console.log("[userManagementStore] API response received:", res.data);

        // Normalize response shape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;

        // Extract user data from possible wrapper structures
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let userData: any = null;

        if (payload?.data) {
          userData = payload.data;
        } else if (payload?.user) {
          userData = payload.user;
        } else {
          userData = payload;
        }

        console.log("[userManagementStore] Extracted user data:", userData);
        console.log(
          "[userManagementStore] Available keys:",
          Object.keys(userData || {})
        );

        if (!userData) {
          throw new Error("User data not found in response");
        }

        // Map to UserDetail interface
        const roleValue =
          userData.role ??
          userData.userRole ??
          userData.type ??
          userData.accountType ??
          undefined;

        const mappedUser: UserDetail = {
          id: String(userData.id ?? userData.userId ?? userData._id ?? ""),
          name: String(
            userData.name ??
              `${userData.firstName ?? ""} ${userData.lastName ?? ""}`
          ).trim(),
          username: userData.username ?? userData.userName ?? undefined,
          email: userData.email ?? undefined,
          phone: userData.phone ?? userData.mobile ?? undefined,
          role: roleValue,
          status: userData.status ?? undefined,
          avatar:
            userData.avatar ??
            (userData.name
              ? String(userData.name)
                  .split(" ")
                  .map((s: string) => s[0])
                  .join("")
                  .slice(0, 2)
              : undefined),
          region: userData.region ?? userData.location ?? undefined,
          firstName: userData.firstName ?? undefined,
          lastName: userData.lastName ?? undefined,
          createdAt: userData.createdAt ?? undefined,
          updatedAt: userData.updatedAt ?? undefined,
          lastLogin: userData.lastLogin ?? undefined,
          verified: userData.verified ?? userData.isVerified ?? undefined,
        };

        console.log("[userManagementStore] Mapped user detail:", mappedUser);

        set({
          selectedUser: mappedUser,
          loading: { ...get().loading, selectedUser: false },
        });
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Failed to fetch user details";
        console.error("[userManagementStore] fetchUserById error:", {
          message: errorMessage,
          error: err,
        });

        set({
          error: { ...get().error, selectedUser: errorMessage },
          loading: { ...get().loading, selectedUser: false },
        });
      }
    },

    fetchUserByUsername: async (username: string) => {
      console.log(
        "[userManagementStore] fetchUserByUsername called with username:",
        username
      );

      if (!username) {
        console.error("[userManagementStore] Invalid username provided");
        set({
          error: { ...get().error, selectedUser: "Invalid username" },
        });
        return;
      }

      set({
        loading: { ...get().loading, selectedUser: true },
        error: { ...get().error, selectedUser: null },
      });

      try {
        // First, check if we have the user in the cached users list
        const cachedUser = get().users?.find(
          (u) => u.username?.toLowerCase() === username.toLowerCase()
        );

        if (cachedUser) {
          console.log(
            "[userManagementStore] Found user in cache, fetching full details by ID:",
            cachedUser.id
          );
          // Fetch full details using the ID
          await get().fetchUserById(cachedUser.id);
          return;
        }

        // If not in cache, fetch all users first to find the ID
        console.log(
          "[userManagementStore] User not in cache, fetching all users to find username"
        );
        await get().fetchUsers(1, 100); // Fetch more users to increase chance of finding

        const foundUser = get().users?.find(
          (u) => u.username?.toLowerCase() === username.toLowerCase()
        );

        if (foundUser) {
          console.log(
            "[userManagementStore] Found user after fetch, getting details by ID:",
            foundUser.id
          );
          await get().fetchUserById(foundUser.id);
        } else {
          throw new Error(`User with username "${username}" not found`);
        }
      } catch (err) {
        const errorMessage =
          (err as Error).message || "Failed to fetch user by username";
        console.error("[userManagementStore] fetchUserByUsername error:", {
          message: errorMessage,
          error: err,
        });

        set({
          error: { ...get().error, selectedUser: errorMessage },
          loading: { ...get().loading, selectedUser: false },
        });
      }
    },

    fetchPendingSellerApplications: async () => {
      console.log(
        "[userManagementStore] fetchPendingSellerApplications called"
      );

      if (typeof window !== "undefined") {
        console.log(
          "[userManagementStore] 🔐 Fetching pending seller applications (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, sellerApplications: true },
        error: { ...get().error, sellerApplications: null },
      });

      try {
        console.log(
          "[userManagementStore] Fetching from API: v1/super-admin/seller-applications/pending"
        );
        const res = await api.get("v1/super-admin/seller-applications/pending");
        console.log("[userManagementStore] API response received:", res.data);

        // Normalize possible response shapes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = res.data;
        console.log(
          "[userManagementStore] Payload type:",
          Array.isArray(payload) ? "array" : typeof payload
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let items: any[] = [];

        if (Array.isArray(payload)) {
          console.log(
            "[userManagementStore] Payload is array, length:",
            payload.length
          );
          items = payload;
        } else if (payload?.data) {
          if (Array.isArray(payload.data)) {
            console.log(
              "[userManagementStore] payload.data is array, length:",
              payload.data.length
            );
            items = payload.data;
          } else if (Array.isArray(payload.data?.data)) {
            console.log(
              "[userManagementStore] payload.data.data is array, length:",
              payload.data.data.length
            );
            items = payload.data.data;
          }
        } else if (typeof payload === "object") {
          items =
            payload.applications || payload.sellers || payload.items || [];
          console.log(
            "[userManagementStore] Extracted items from object wrapper, length:",
            items.length
          );
        }

        console.log("[userManagementStore] Raw items before mapping:", items);

        // Log first application's raw data to see available fields
        if (items.length > 0) {
          console.log(
            "[userManagementStore] Sample raw seller application:",
            items[0]
          );
          console.log(
            "[userManagementStore] Available keys in raw application:",
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
          "[userManagementStore] Mapped seller applications:",
          mapped
        );
        console.log(
          "[userManagementStore] Total applications fetched:",
          mapped.length
        );

        set({
          sellerApplications: mapped,
          loading: { ...get().loading, sellerApplications: false },
        });
      } catch (err) {
        const errorMessage =
          (err as Error).message ||
          "Failed to fetch pending seller applications";
        console.error(
          "[userManagementStore] fetchPendingSellerApplications error:",
          {
            message: errorMessage,
            error: err,
          }
        );

        set({
          error: { ...get().error, sellerApplications: errorMessage },
          loading: { ...get().loading, sellerApplications: false },
        });
      }
    },

    archiveUser: async (id: string) => {
      console.log("[userManagementStore] archiveUser called with id:", id);

      if (!id) {
        console.error("[userManagementStore] Invalid user ID provided");
        throw new Error("Invalid user ID");
      }

      if (typeof window !== "undefined") {
        console.log(
          "[userManagementStore] 🔐 Archiving user (refreshToken sent automatically via HttpOnly cookie)"
        );
      }

      set({
        loading: { ...get().loading, archiveUser: true },
        error: { ...get().error, archiveUser: null },
      });

      try {
        // Archive user via dedicated API route that handles CSRF internally
        // This avoids CORS issues with direct backend calls
        console.log(
          `[userManagementStore] Archiving user via API route: DELETE /api/users/${id}`
        );

        // Get access token from tokenManager
        const { getAccessToken } = await import("@/lib/tokenManager");
        const accessToken = getAccessToken();

        if (!accessToken) {
          throw new Error("Access token not found - please login again");
        }

        const response = await fetch(`/api/users/${id}`, {
          method: "DELETE",
          credentials: "include", // Send cookies for CSRF
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[userManagementStore] Delete failed:", errorData);
          throw new Error(
            errorData.message || `Delete failed: ${response.status}`
          );
        }

        const resData = await response.json();
        console.log("[userManagementStore] Archive API response:", resData);

        // Remove user from cached list if it exists
        const currentUsers = get().users;
        if (currentUsers) {
          const updatedUsers = currentUsers.filter((u) => u.id !== id);
          console.log(
            `[userManagementStore] Removed user ${id} from cache. Remaining users:`,
            updatedUsers.length
          );
          set({ users: updatedUsers });
        }

        // Clear selected user if it was the archived one
        if (get().selectedUser?.id === id) {
          console.log(
            "[userManagementStore] Clearing selected user as it was archived"
          );
          set({ selectedUser: null });
        }

        set({
          loading: { ...get().loading, archiveUser: false },
        });

        console.log("[userManagementStore] User archived successfully");
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = err as any;
        let errorMessage = "Failed to archive user";

        // Handle 403 Forbidden - insufficient permissions
        if (axiosError?.response?.status === 403) {
          errorMessage =
            "Access denied: Only ADMIN or SUPER_ADMIN can archive users";
          console.error(
            "[userManagementStore] 403 Forbidden - Current user lacks required role (ADMIN/SUPER_ADMIN)"
          );
        } else {
          errorMessage =
            axiosError?.message ||
            axiosError?.response?.data?.message ||
            errorMessage;
        }

        console.error("[userManagementStore] archiveUser error:", {
          message: errorMessage,
          status: axiosError?.response?.status,
          error: err,
        });

        set({
          error: { ...get().error, archiveUser: errorMessage },
          loading: { ...get().loading, archiveUser: false },
        });

        throw new Error(errorMessage); // Re-throw with clear message
      }
    },

    clearSelectedUser: () => {
      console.log("[userManagementStore] Clearing selected user");
      set({ selectedUser: null });
    },
  }))
);
