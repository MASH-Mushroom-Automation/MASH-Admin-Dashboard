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

// User item interface
export interface UserItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  avatar?: string;
  region?: string;
}

// Detailed user interface for single user fetch
export interface UserDetail extends UserItem {
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  verified?: boolean;
  // Add other fields as needed based on backend response
}

interface UserManagementState {
  users: UserItem[] | null;
  selectedUser: UserDetail | null;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  fetchUserByUsername: (username: string) => Promise<void>;
  clearSelectedUser: () => void;
}

export const useUserManagementStore = create<UserManagementState>()(
  devtools((set, get) => ({
    users: null,
    selectedUser: null,
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

    clearSelectedUser: () => {
      console.log("[userManagementStore] Clearing selected user");
      set({ selectedUser: null });
    },
  }))
);
