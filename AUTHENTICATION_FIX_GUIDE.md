# Authentication & Dashboard Error Fix Guide

## 🚨 Critical Issue Identified

### Problem: "Invalid token" 401 Errors on Dashboard API Calls

**Root Cause**: Token architecture mismatch between login and dashboard API calls

```
Login Flow (WORKS ✅):
  Backend API → Returns tokens → Store in localStorage

Dashboard API Calls (FAILS ❌):
  localStorage token → axios interceptor adds Bearer header → /api/proxy → ❌ Proxy ignores client headers → Backend gets NO token → 401 Unauthorized
```

**Log Evidence**:
```
[PROXY] GET → https://mash-backend-api-production.up.railway.app/api/v1/super-admin/dashboard/overview
[PROXY] Cookie: YES
[PROXY] Token extracted: NO  ← ❌ PROBLEM: Proxy can't extract token from cookies
```

**Why It Fails**:
1. Login stores `accessToken` in **localStorage** (via `tokenManager.ts`)
2. Login stores `refreshToken` in **localStorage** (via `authStore.ts`)
3. Dashboard calls use `api.get()` which adds `Authorization: Bearer {token}` header from memory
4. **BUT**: `/api/proxy` only looks for `authToken` in **cookies** (line 55-56 in route.ts)
5. Client-sent `Authorization` header is **ignored** by proxy
6. Backend receives request with **no token** → 401 Unauthorized

---

## 🎯 Solution Overview

**Two architecture options**:

### Option A: Fix Proxy to Use Client Headers (RECOMMENDED)
- ✅ Keep current direct backend authentication
- ✅ Keep localStorage token storage (more secure)
- ✅ Update proxy to forward client's Authorization header
- ✅ Simple 1-file fix

### Option B: Switch Back to Cookie-Based Auth
- ❌ Requires rewriting login flow
- ❌ Requires updating authStore
- ❌ More complex changes
- ❌ Less secure (XSS vulnerability)

**We'll implement Option A** - it's cleaner and maintains security.

---

## 🔧 Fix Implementation

### File to Modify: `/src/app/api/proxy/[...path]/route.ts`

**Current Code (Lines 54-60)**:
```typescript
const cookie = req.headers.get("cookie") || "";
const tokenMatch = cookie.match(/authToken=([^;]+)/);
const token = tokenMatch ? tokenMatch[1] : null;

console.log(`[PROXY] Cookie:`, cookie ? "YES" : "NO");
console.log(`[PROXY] Token extracted:`, token ? "YES" : "NO");
```

**Problem**: Only extracts token from cookies, ignores client's Authorization header

**Fixed Code**:
```typescript
// Priority 1: Check if client already sent Authorization header (direct backend auth)
let token = req.headers.get("authorization");
if (token?.startsWith("Bearer ")) {
  token = token.substring(7); // Remove "Bearer " prefix
  console.log(`[PROXY] Token from Authorization header: YES`);
} else {
  // Priority 2: Fallback to cookie-based token (if present)
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/authToken=([^;]+)/);
  token = tokenMatch ? tokenMatch[1] : null;
  console.log(`[PROXY] Cookie:`, cookie ? "YES" : "NO");
  console.log(`[PROXY] Token from cookie:`, token ? "YES" : "NO");
}
```

**What This Does**:
1. **First**: Check if client sent `Authorization: Bearer {token}` header
2. **Then**: If not, fall back to checking cookies (backward compatibility)
3. **Forward**: Pass the token to backend as `Authorization: Bearer {token}`

---

## 📋 Complete Authentication Flow (After Fix)

### 1. Login Process ✅ (Already Working)
```
User submits login form
  ↓
Frontend → https://mash-backend-api-production.up.railway.app/api/v1/auth/login
  ↓
Backend validates credentials
  ↓
Backend returns:
  {
    accessToken: "eyJ..." (1 hour validity),
    refreshToken: "eyJ..." (7 days validity),
    user: { id, email, firstName, lastName }
  }
  ↓
authStore.login() stores:
  - accessToken → tokenManager (in-memory)
  - refreshToken → localStorage (key: "refreshToken")
  - user → localStorage (key: "auth-storage" via Zustand persist)
  ↓
Success toast → Redirect to /dashboard
```

### 2. Dashboard Load ✅ (Will Work After Fix)
```
Dashboard layout mounts
  ↓
Checks: useAuthStore().isAuthenticated && user exists
  ↓ YES
Dashboard page mounts → Calls useDashboardStore().fetchOverview()
  ↓
api.get('v1/super-admin/dashboard/overview')
  ↓
Axios interceptor adds: Authorization: Bearer {accessToken} (from memory)
  ↓
Request to: /api/proxy/v1/super-admin/dashboard/overview
  ↓
✅ FIXED: Proxy extracts token from Authorization header
  ↓
Proxy forwards to: https://mash-backend-api-production.up.railway.app/api/v1/super-admin/dashboard/overview
Headers: { Authorization: "Bearer {token}" }
  ↓
Backend validates JWT → 200 OK → Dashboard data rendered
```

### 3. Token Refresh Flow (When Access Token Expires)
```
Access token expires (1 hour)
  ↓
Dashboard API call → 401 Unauthorized
  ↓
axios interceptor catches 401
  ↓
Calls: /api/auth/refresh
  ↓
Refresh endpoint reads refreshToken from localStorage
  ↓
Sends to backend: POST /api/v1/auth/refresh-token
  ↓
Backend validates refresh token
  ↓
Backend returns new: { accessToken, refreshToken }
  ↓
Store new tokens → Retry original request → Success
```

---

## 🐛 Debugging Checklist

### Before Fix - Expected Errors
- [ ] Console logs: `[PROXY] Token extracted: NO`
- [ ] Dashboard API calls return: 401 Unauthorized
- [ ] Backend error: `"message": "Invalid token"`
- [ ] Dashboard shows loading spinner forever
- [ ] Eventually redirects to login after multiple 401s

### After Fix - Expected Success
- [ ] Console logs: `[PROXY] Token from Authorization header: YES`
- [ ] Dashboard API calls return: 200 OK
- [ ] Dashboard data loads properly
- [ ] User name appears in sidebar: "Jhon Keneth Namias"
- [ ] All dashboard cards show data

---

## 🧪 Testing Steps

### 1. Test Login Flow
```bash
# Open browser DevTools → Network tab
# Navigate to http://localhost:3001/login
# Enter credentials: mash.mushroom.automation@gmail.com / PP@Namias99
# Click "Sign in"

✅ Expected:
  - Toast: "Signing in..."
  - Toast: "Login successful! Redirecting..."
  - Redirect to /dashboard
  - No errors in console
```

### 2. Test Dashboard Load
```bash
# After successful login, check:

✅ Expected in DevTools → Application → Local Storage:
  - auth-storage: { user: {...}, isAuthenticated: true }
  - refreshToken: "eyJ..."

✅ Expected in DevTools → Console:
  - "✅ Dashboard loaded for user: mash.mushroom.automation@gmail.com"
  - "[PROXY] Token from Authorization header: YES"
  - No 401 errors

✅ Expected in UI:
  - Dashboard cards show data (not "No data")
  - Sidebar shows user name: "Jhon Keneth Namias"
  - Charts render with data
  - No infinite loading spinners
```

### 3. Test Token Refresh (After 1 Hour)
```bash
# Wait for access token to expire OR manually clear from memory:
# In DevTools console:
> localStorage.removeItem('accessToken') # This is in memory, not localStorage
> location.reload()

✅ Expected:
  - First API call: 401 Unauthorized
  - Axios interceptor triggers refresh
  - POST /api/auth/refresh: 200 OK
  - New access token stored
  - Original API call retried: 200 OK
  - Dashboard loads successfully
```

### 4. Test Logout Flow
```bash
# Click logout button in sidebar

✅ Expected:
  - All localStorage cleared
  - Redirect to /login
  - Access token cleared from memory
  - Cookies cleared (if any)
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Still Getting 401 After Fix
**Symptoms**: `[PROXY] Token from Authorization header: NO`

**Cause**: Access token not in memory

**Solution**:
1. Check localStorage: `localStorage.getItem('refreshToken')`
2. If present, page refresh should trigger token refresh
3. If not present, user needs to log in again

### Issue 2: Infinite Redirect Loop (Login → Dashboard → Login)
**Symptoms**: Page keeps redirecting between /login and /dashboard

**Cause**: Auth state mismatch (user in store but no valid token)

**Solution**:
```typescript
// Clear all auth state and start fresh
localStorage.clear()
sessionStorage.clear()
// Reload page
location.reload()
```

### Issue 3: Dashboard Shows "No data" Cards
**Symptoms**: Dashboard loads but all cards show "No data available"

**Cause**: Mock data being used OR API calls failing silently

**Solution**:
1. Check console for 401 errors
2. Check Network tab: All `/api/proxy/*` calls should be 200 OK
3. If 401: Token issue (see Issue 1)
4. If 200 but empty: Backend has no data (expected for new accounts)

### Issue 4: Token Refresh Fails
**Symptoms**: POST /api/auth/refresh returns 401

**Cause**: Refresh token expired (7 days) or invalid

**Solution**:
1. User must log in again
2. Check refresh token expiry: Decode JWT at jwt.io
3. If expired: `localStorage.clear()` and redirect to login

---

## 📊 Architecture Comparison

### Current (Direct Backend Auth) ✅ RECOMMENDED
```
Pros:
  ✅ No Next.js API route needed for login
  ✅ Tokens stored in localStorage (XSS protection)
  ✅ Direct backend communication
  ✅ Simpler architecture
  ✅ No server-side cookie management
  ✅ Works with static export

Cons:
  ⚠️ Requires proxy fix for dashboard calls
  ⚠️ Tokens visible in Network tab (less secure than HttpOnly cookies)
```

### Alternative (Cookie-Based Auth) ❌ NOT RECOMMENDED
```
Pros:
  ✅ HttpOnly cookies (XSS immune)
  ✅ Tokens never exposed to JavaScript
  ✅ Proxy works without modifications

Cons:
  ❌ Requires Next.js API route for login
  ❌ Complex server-side cookie management
  ❌ CORS issues if frontend/backend on different domains
  ❌ Doesn't work with static export
  ❌ More code to maintain
```

---

## 🚀 Deployment Considerations

### Environment Variables
```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app

# Vercel Environment Variables (production)
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
```

### Security Checklist
- [ ] HTTPS enabled on production
- [ ] CORS configured on backend to allow frontend domain
- [ ] Rate limiting enabled on backend (10 req/min for login)
- [ ] Tokens have proper expiry (1h access, 7d refresh)
- [ ] Refresh token rotation enabled on backend
- [ ] Error messages don't leak sensitive info

### Performance Optimization
- [ ] Token refresh happens automatically before expiry
- [ ] Failed requests with 401 trigger refresh ONCE (no infinite loops)
- [ ] Dashboard data cached in Zustand store
- [ ] Loading states prevent duplicate API calls

---

## 📝 Code Changes Summary

### 1. Proxy Route (REQUIRED)
**File**: `/src/app/api/proxy/[...path]/route.ts`

**Change**: Extract token from Authorization header first, then fall back to cookies

**Lines Modified**: 54-60 (see "Fix Implementation" section above)

### 2. Dashboard Page (ALREADY FIXED)
**File**: `/src/app/dashboard/page.tsx`

**Change**: Removed cookie verification, added user check in data fetching useEffect

**Status**: ✅ Completed in previous fix

### 3. Dashboard Layout (ALREADY FIXED)
**File**: `/src/app/dashboard/layout.tsx`

**Change**: Converted to client component with Zustand auth check

**Status**: ✅ Completed in previous fix

### 4. Login Form (ALREADY FIXED)
**File**: `/src/app/login/login-form.tsx`

**Change**: Removed cookie verification, simplified auth check

**Status**: ✅ Completed in previous fix

---

## 🎯 Success Criteria

### Login Success
- [x] Backend returns 200 OK with tokens
- [x] Tokens stored in localStorage
- [x] Success toast displays
- [x] Redirects to /dashboard within 500ms
- [x] No console errors

### Dashboard Success
- [ ] Dashboard layout renders (not redirect loop)
- [ ] Loading spinner shows briefly
- [ ] All 5 API calls succeed (overview, sales, chambers, users-stats, cards)
- [ ] Data cards show numbers (not "No data")
- [ ] Sidebar shows user name: "Jhon Keneth Namias"
- [ ] No 401 errors in console
- [ ] Console logs: `[PROXY] Token from Authorization header: YES`

### Refresh Success
- [ ] Access token expires after 1 hour
- [ ] Axios interceptor catches 401
- [ ] Refresh endpoint called automatically
- [ ] New tokens stored
- [ ] Original request retried
- [ ] No user interruption

### Logout Success
- [ ] localStorage cleared
- [ ] Memory token cleared
- [ ] Redirects to /login
- [ ] Cookies cleared (if any)
- [ ] Cannot access /dashboard without login

---

## 🔗 Related Documentation

- **LOGIN_MIGRATION_PLAN.md**: Original plan for direct backend auth
- **FINAL_FIX_SUMMARY.md**: Previous authentication fixes
- **BACKEND_INTEGRATION_PLAN.md**: Full backend integration roadmap
- **BUILD_STATUS.md**: Next.js 15 migration notes

---

## 📞 Support & Troubleshooting

### If Issues Persist

1. **Clear all browser data**:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   // DevTools → Application → Cookies → Delete all
   ```

2. **Check backend API health**:
   ```bash
   curl https://mash-backend-api-production.up.railway.app/api/health
   ```

3. **Verify token validity**:
   - Copy access token from localStorage
   - Paste into https://jwt.io
   - Check expiry date and claims

4. **Enable verbose logging**:
   - Open DevTools console
   - All proxy requests log: `[PROXY]` prefix
   - All axios requests log: `api ->` prefix

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401  | Invalid/expired token | Trigger refresh or re-login |
| 403  | Valid token, insufficient permissions | User lacks required role |
| 429  | Rate limit exceeded | Wait 1 minute, retry |
| 500  | Backend server error | Check backend logs |
| 502  | Bad gateway (backend down) | Check Railway deployment |

---

**Last Updated**: November 13, 2025  
**Status**: Ready for implementation  
**Priority**: 🔴 CRITICAL - Blocks dashboard functionality
