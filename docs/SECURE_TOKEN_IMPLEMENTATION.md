# Secure Token Implementation Guide

## ✅ Implementation Complete

This document describes the secure token management system implemented in MASH Admin Dashboard following industry best practices.

## Architecture Overview

### Token Types

1. **Access Token** (Short-lived - 1 hour)

   - **Storage**: In-memory only via `/src/lib/tokenManager.ts`
   - **Usage**: Sent in `Authorization: Bearer <token>` header
   - **Security**: Protected from XSS attacks (not in localStorage/cookies)
   - **Lifecycle**: Cleared on page refresh, logout, or expiry

2. **Refresh Token** (Long-lived - 7 days)
   - **Storage**: HttpOnly, Secure, SameSite cookie
   - **Usage**: Automatically sent by browser to `/api/auth/refresh`
   - **Security**: Protected from XSS (not accessible to JavaScript)
   - **Lifecycle**: Rotated on each refresh, cleared on logout

---

## Authentication Flow

### 1. Login Flow

```typescript
// Client: src/app/login/login-form.tsx
const handleSubmit = async (e) => {
  await login(email, password); // Zustand action
  router.push("/dashboard");
};

// Store: src/store/authStore.ts
login: async (email, password) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include", // ← CRITICAL: Enables cookies
    body: JSON.stringify({ email, password }),
  });

  const { accessToken, expiresIn, user } = await response.json();

  // Store access token in memory (XSS protection)
  setAccessToken(accessToken, expiresIn);

  // Store user in Zustand (persisted to localStorage)
  set({ user, isAuthenticated: true });

  // ✅ Refresh token automatically stored in HttpOnly cookie by backend
};

// API Route: src/app/api/auth/login/route.ts
export async function POST(request) {
  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, body);
  const { accessToken, refreshToken, user } = backendRes.data;

  const response = NextResponse.json({
    success: true,
    user,
    accessToken, // ← Client stores in memory
    expiresIn: 3600, // ← 1 hour
  });

  // Set ONLY refresh token in HttpOnly cookie
  response.cookies.set({
    name: "refreshToken",
    value: refreshToken,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: "lax",
    secure: isProd,
  });

  return response;
}
```

**Security Benefits:**

- ✅ Access token never touches localStorage (XSS protection)
- ✅ Refresh token never exposed to JavaScript (XSS protection)
- ✅ Refresh token in HttpOnly cookie (CSRF mitigation via SameSite)

---

### 2. Authenticated API Requests

```typescript
// Axios Instance: src/lib/api.ts
export const api = axios.create({
  baseURL: "/api/proxy",
  withCredentials: true, // ← CRITICAL: Sends cookies
});

// Request Interceptor (adds access token)
api.interceptors.request.use((config) => {
  const token = getAccessToken(); // From memory
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage in Components
const fetchUsers = async () => {
  const res = await api.get("v1/super-admin/users");
  // ✅ Token automatically added from memory
  // ✅ Request goes to /api/proxy → backend with Bearer token
};
```

**Request Flow:**

```
Component → api.get() → Request Interceptor → Add Bearer Token →
/api/proxy → Extract Token → Forward to Backend
```

---

### 3. Token Refresh Flow (Automatic)

```typescript
// Response Interceptor: src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Call refresh endpoint (HttpOnly cookie sent automatically)
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // ← CRITICAL: Sends refresh token cookie
      });

      if (refreshResponse.ok) {
        const { accessToken, expiresIn } = await refreshResponse.json();

        // Update in-memory access token
        setAccessToken(accessToken, expiresIn);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// API Route: src/app/api/auth/refresh/route.ts
export async function POST() {
  const refreshToken = cookies.get("refreshToken")?.value;

  // Call backend refresh endpoint
  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh-token`, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  const { accessToken, refreshToken: newRefreshToken } = backendRes.data;

  const response = NextResponse.json({
    success: true,
    accessToken, // ← Returned to client (stored in memory)
    expiresIn: 3600,
  });

  // Update refresh token in HttpOnly cookie (token rotation)
  if (newRefreshToken) {
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      secure: isProd,
    });
  }

  return response;
}
```

**Security Benefits:**

- ✅ Automatic token refresh on 401 errors
- ✅ Token rotation prevents replay attacks
- ✅ Transparent to components (axios interceptor handles it)
- ✅ No manual refresh logic needed in UI code

---

### 4. Logout Flow

```typescript
// Store: src/store/authStore.ts
logout: () => {
  // Clear in-memory access token
  clearAccessToken();

  // Call logout endpoint to clear HttpOnly cookies
  fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  // Clear user from Zustand
  set({ user: null, isAuthenticated: false });
};

// API Route: src/app/api/auth/logout/route.ts
export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear refresh token cookie
  response.cookies.set({
    name: "refreshToken",
    value: "",
    maxAge: 0,
    httpOnly: true,
  });

  return response;
}
```

---

## Middleware Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Check for refresh token (long-lived)
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
```

**Note:** Middleware checks for `refreshToken` cookie (not access token) because:

- Access tokens are in memory (not accessible to middleware)
- Refresh token presence indicates valid authentication
- If access token expires, it will be refreshed automatically

---

## Token Manager API

```typescript
// src/lib/tokenManager.ts

// Set access token in memory
setAccessToken(token: string, expiresIn: number): void

// Get access token (returns null if expired)
getAccessToken(): string | null

// Clear access token
clearAccessToken(): void

// Check if token should be refreshed (5 min before expiry)
shouldRefreshToken(): boolean
```

**Usage Example:**

```typescript
import { setAccessToken, getAccessToken } from "@/lib/tokenManager";

// After login
setAccessToken(accessToken, 3600);

// Before API call
const token = getAccessToken(); // null if expired
```

---

## Security Best Practices Implemented

### ✅ XSS Protection

- Access tokens stored in memory only (never in localStorage)
- Refresh tokens in HttpOnly cookies (not accessible to JS)
- No token exposure to JavaScript runtime

### ✅ CSRF Protection

- `SameSite: "lax"` cookie attribute
- Refresh token only sent to same-origin requests
- No state-changing operations without proper tokens

### ✅ Token Rotation

- New refresh token issued on each refresh
- Old refresh tokens invalidated by backend
- Prevents replay attacks

### ✅ Least Privilege

- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days) but more secure
- Automatic token refresh before expiry

### ✅ Defense in Depth

- Middleware checks (refresh token presence)
- API interceptors (automatic retry on 401)
- Backend validation (token signature/expiry)

---

## Common Patterns

### Pattern 1: API Call with Auth

```typescript
import { api } from "@/lib/api";

const fetchData = async () => {
  try {
    const res = await api.get("v1/super-admin/data");
    // ✅ Token automatically added
    // ✅ Auto-refresh on 401
    return res.data;
  } catch (error) {
    // Handle error
  }
};
```

### Pattern 2: Direct Fetch (Non-API Routes)

```typescript
const response = await fetch("/api/auth/login", {
  method: "POST",
  credentials: "include", // ← Always include for cookie support
  body: JSON.stringify(data),
});
```

### Pattern 3: Check Authentication

```typescript
import { useAuthStore } from "@/store/authStore";
import { getAccessToken } from "@/lib/tokenManager";

const { user, isAuthenticated } = useAuthStore();
const hasValidToken = getAccessToken() !== null;

if (isAuthenticated && hasValidToken) {
  // User is authenticated
}
```

---

## Migration Checklist

If migrating from old auth system:

- [x] Remove all `localStorage.setItem('accessToken', ...)` calls
- [x] Remove all `localStorage.getItem('accessToken')` calls
- [x] Remove all direct backend calls (use `/api/auth/login` instead)
- [x] Update API calls to use `api` instance from `/src/lib/api.ts`
- [x] Add `credentials: "include"` to all fetch calls
- [x] Update middleware to check `refreshToken` (not `authToken`)
- [x] Remove `authToken` cookie references (only use `refreshToken`)
- [x] Update logout to clear `refreshToken` cookie

---

## Testing

### Test Login Flow

```bash
# 1. Start dev server
npm run dev

# 2. Open browser → http://localhost:3001/login
# 3. Login with credentials
# 4. Check DevTools:
#    - Application → Cookies → refreshToken (HttpOnly ✓)
#    - Console → No token in localStorage ✓
#    - Network → Authorization: Bearer header ✓
```

### Test Token Refresh

```bash
# 1. Login and wait 55+ minutes (or modify tokenExpiry in tokenManager)
# 2. Make an API call
# 3. Check Network tab:
#    - 401 response → /api/auth/refresh call → retry with new token ✓
```

### Test Logout

```bash
# 1. Login
# 2. Logout
# 3. Check DevTools:
#    - Cookies → refreshToken deleted ✓
#    - Console → tokenManager cleared ✓
#    - User redirected to /login ✓
```

---

## Troubleshooting

### Issue: "No refresh token found" on API calls

**Solution:** Ensure `credentials: "include"` in fetch calls

### Issue: Token not refreshing automatically

**Solution:** Check axios interceptor in `/src/lib/api.ts`

### Issue: Redirect loop after login

**Solution:** Check middleware - should check `refreshToken` not `authToken`

### Issue: 401 errors after page refresh

**Solution:** Check if `setAccessToken()` is called after login

---

## File Reference

| File                                 | Purpose                                |
| ------------------------------------ | -------------------------------------- |
| `/src/lib/tokenManager.ts`           | In-memory access token storage         |
| `/src/store/authStore.ts`            | Login/logout logic, user state         |
| `/src/lib/api.ts`                    | Axios instance with token interceptors |
| `/src/app/api/auth/login/route.ts`   | Login endpoint (sets refresh cookie)   |
| `/src/app/api/auth/refresh/route.ts` | Token refresh endpoint                 |
| `/src/app/api/auth/logout/route.ts`  | Logout endpoint (clears cookies)       |
| `/middleware.ts`                     | Auth guard for protected routes        |

---

## Summary

✅ **Access Token**: Short-lived (1h), in-memory, sent in headers  
✅ **Refresh Token**: Long-lived (7d), HttpOnly cookie, automatic refresh  
✅ **XSS Protection**: No tokens in localStorage  
✅ **CSRF Protection**: SameSite cookies + token rotation  
✅ **Automatic Refresh**: Transparent 401 → refresh → retry  
✅ **Secure Logout**: Clears both tokens properly

**Never mix token storage!** Access token = memory, Refresh token = cookie.
