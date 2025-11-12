# Backend Integration Plan - MASH Admin Dashboard

## Overview

This document outlines the plan to connect the MASH Admin Dashboard frontend to the production backend API (`https://mash-backend-api-production.up.railway.app`) with minimal design changes.

**Current Status**: Frontend uses mock data and `/api/proxy` pattern for some endpoints
**Goal**: Full integration with production backend while preserving UI/UX
**Estimated Effort**: 3-4 weeks (phased approach)

---

## 🎯 Integration Strategy

### Phase 1: Authentication System (Week 1) ✅ 100% COMPLETE

**Status**: All authentication flows complete with 6-digit verification system. Login, Registration, and Password Reset fully integrated.

#### Current Implementation
- ✅ Login endpoint: `/src/app/api/auth/login/route.ts`
- ✅ Hardcoded admin fallback
- ✅ HttpOnly cookie management
- ✅ Forgot password flow (3-step wizard)

#### Backend Endpoints to Integrate

| Endpoint | Status | Frontend Location | Notes |
|----------|--------|-------------------|-------|
| `POST /api/v1/auth/login` | ✅ Connected | `/src/app/api/auth/login/route.ts` | Working via proxy, hardcoded admin fallback |
| `POST /api/v1/auth/register` | ✅ Connected | `/src/app/register/page.tsx` | ✅ **COMPLETED** - Full form with password strength indicator |
| `POST /api/v1/auth/verify-email` | ⚠️ Deprecated | N/A | Replaced by verify-email-code (6-digit system) |
| `POST /api/v1/auth/verify-email-code` | ✅ Connected | `/src/app/register/verify/page.tsx` | ✅ **COMPLETED** - 6-digit code verification with auto-login |
| `POST /api/v1/auth/resend-verification-code` | ✅ Connected | `/src/app/register/verify/page.tsx` | ✅ **COMPLETED** - Resend with 60-second cooldown |
| `POST /api/v1/auth/forgot-password` | ✅ Connected | `/src/app/forgot-password/forgot-pass/` | ✅ **COMPLETED** - Sends 6-digit code to email |
| `POST /api/v1/auth/verify-reset-code` | ✅ Connected | `/src/app/forgot-password/verify/` | ✅ **COMPLETED** - Validates code before reset |
| `POST /api/v1/auth/reset-password` | ✅ Connected | `/src/app/forgot-password/reset/` | ✅ **COMPLETED** - Resets password with code |
| `POST /api/v1/auth/resend-password-reset-code` | ✅ Connected | `/src/app/forgot-password/verify/` | ✅ **COMPLETED** - Resend with 60s cooldown |

#### Tasks

**1.1 Update Login Flow**
- [x] Keep hardcoded admin fallback (requirement)
- [x] Add JWT token handling (access + refresh tokens) ✅ **COMPLETED**
- [x] Store tokens in HttpOnly cookies (already done)
- [x] Handle token refresh mechanism ✅ **COMPLETED** - `/api/auth/refresh` route created
- [ ] Add session management UI in navbar

**1.2 Create Registration Flow** ✅ **COMPLETED**
```
Location: /src/app/register/
Components created:
  ✅ page.tsx - Registration form with React Hook Form + Zod validation (267 lines)
  ✅ layout.tsx - Consistent styling with login page (15 lines)
  ✅ verify/page.tsx - 6-digit code verification with auto-login (238 lines)
  
Features implemented:
  ✅ Email validation (DNS check via backend)
  ✅ Password strength indicator (5-level visual feedback: Weak→Strong)
  ✅ First name, last name, username (optional) fields
  ✅ Real-time form validation with error messages
  ✅ Loading states with spinners (Loader2 icon)
  ✅ Resend code with 60-second cooldown timer
  ✅ Direct backend API calls (bypasses proxy for registration)
  ✅ Auto-login after verification (JWT token stored in tokenManager)
  ✅ SessionStorage for email persistence between steps
  ✅ Redirect to dashboard after successful verification
  ✅ Show/hide password toggle with Eye/EyeOff icons
  ✅ Numeric-only input for 6-digit code (auto-focus, maxLength)
  
Backend Integration:
  ✅ POST /api/v1/auth/register - Create new user account
  ✅ POST /api/v1/auth/verify-email-code - Verify 6-digit code
  ✅ POST /api/v1/auth/resend-verification-code - Resend code with cooldown
  
Flow:
  1. User fills registration form → validates all fields
  2. POST /api/v1/auth/register (direct to backend, no proxy)
  3. Email stored in sessionStorage.setItem('registerEmail', email)
  4. Redirect to /register/verify
  5. User enters 6-digit code from email (expires in 10 minutes)
  6. POST /api/v1/auth/verify-email-code
  7. JWT accessToken + refreshToken received
  8. setAccessToken(token, expiresIn) → stores in memory (tokenManager)
  9. setUser(user) → stores in Zustand (authStore)
  10. sessionStorage.removeItem('registerEmail') → cleanup
  11. Redirect to /dashboard (auto-logged in, can make authenticated requests)
```

**1.3 Migrate to 6-Digit Code System** ✅ **COMPLETED**
```
Location: /src/app/forgot-password/
Files updated:
  ✅ verify/page.tsx - Now uses POST /api/v1/auth/verify-reset-code
  ✅ reset/page.tsx - Now uses POST /api/v1/auth/reset-password with code
  
Changes implemented:
  ✅ Replaced verify-email endpoint with verify-reset-code
  ✅ Replaced forgot-password endpoint with reset-password in reset page
  ✅ Updated resend to use resend-password-reset-code endpoint
  ✅ Code stored in sessionStorage between verify and reset steps
  ✅ Auto-fill verified code in reset page for better UX
  ✅ 60-second cooldown timer already implemented
  ✅ Clean up sessionStorage after successful password reset
  
Backend Integration:
  ✅ POST /api/v1/auth/verify-reset-code - Verify 6-digit code before reset
  ✅ POST /api/v1/auth/reset-password - Reset password with code + new password
  ✅ POST /api/v1/auth/resend-password-reset-code - Resend code with cooldown
  
Flow (Updated):
  1. User enters email → POST /api/v1/auth/forgot-password
  2. Email stored in sessionStorage.setItem('resetEmail', email)
  3. Redirect to /forgot-password/verify
  4. User enters 6-digit code from email (expires in 10 minutes)
  5. POST /api/v1/auth/verify-reset-code (optional pre-validation)
  6. Code stored in sessionStorage.setItem('resetCode', code)
  7. Redirect to /forgot-password/reset
  8. Code auto-filled in form (from sessionStorage)
  9. User enters new password + confirms
  10. POST /api/v1/auth/reset-password with { email, code, newPassword }
  11. Success → sessionStorage cleanup → redirect to /login
```

**1.4 Add Verification Step (Optional)**

Create new route: `/src/app/forgot-password/verify-code/`
- Purpose: Validate code before showing password form
- Better UX: User knows code is valid before entering password
- Endpoint: `POST /api/v1/auth/verify-reset-code`

**1.5 Update AuthStore**

```typescript
// /src/store/authStore.ts - Add new methods

interface AuthState {
  // ... existing fields
  accessToken: string | null // Store in memory only
  refreshToken: string | null // HttpOnly cookie
  tokenExpiry: number | null
  
  // New methods
  register: (data: RegisterData) => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendVerificationCode: (email: string) => Promise<void>
  verifyResetCode: (email: string, code: string) => Promise<boolean>
  refreshAccessToken: () => Promise<void>
}
```

---

### Phase 2: Dashboard Data Integration (Week 2)

**Current Status**: Dashboard uses real API via `/src/store/dashboardStore.ts`

#### Backend Endpoints Needed

| Data Type | Frontend Component | Backend Endpoint | Status |
|-----------|-------------------|------------------|--------|
| Overview Stats | `dashboard/page.tsx` | `GET /api/v1/super-admin/dashboard/overview` | ⚠️ Verify endpoint exists |
| Sales Chart | `components/dashboard/sales-chart.tsx` | `GET /api/v1/super-admin/analytics/sales` | ❌ TBD |
| Recent Activity | `components/dashboard/recent-activity.tsx` | `GET /api/v1/super-admin/activities/recent` | ❌ TBD |
| Chamber Inventory | `components/dashboard/chamber-inventory.tsx` | `GET /api/v1/super-admin/devices/chambers` | ❌ TBD |

#### Tasks

**2.1 Verify Dashboard Endpoints**
```bash
# Test existing endpoint
curl -X GET \
  https://mash-backend-api-production.up.railway.app/api/v1/super-admin/dashboard/overview \
  -H "Authorization: Bearer {token}"
```

**2.2 Map Mock Data to Real API**
- [ ] Document actual API response structure
- [ ] Update TypeScript interfaces in `/src/store/dashboardStore.ts`
- [ ] Remove/comment out mock fallbacks
- [ ] Add loading states for all dashboard sections
- [ ] Implement error boundaries for failed data fetches

**2.3 Create API Documentation**
- [ ] List all required super-admin endpoints
- [ ] Request backend team to expose missing endpoints
- [ ] Document expected response formats

---

### Phase 3: User Management Integration (Week 2-3)

**Current Status**: Uses `MOCK_USERS` constant in `/src/app/mash-market/user/page.tsx` (457 lines)

#### Backend Endpoints Needed

| Action | Method | Endpoint | Frontend Handler |
|--------|--------|----------|------------------|
| List Users | GET | `/api/v1/super-admin/users` | `fetchUsers()` |
| Get User Details | GET | `/api/v1/super-admin/users/:id` | `fetchUserDetails()` |
| Update User | PATCH | `/api/v1/super-admin/users/:id` | `updateUser()` |
| Suspend User | POST | `/api/v1/super-admin/users/:id/suspend` | `suspendUser()` |
| Activate User | POST | `/api/v1/super-admin/users/:id/activate` | `activateUser()` |
| Delete User | DELETE | `/api/v1/super-admin/users/:id` | `deleteUser()` |
| Search Users | GET | `/api/v1/super-admin/users?search={query}` | `searchUsers()` |
| Filter Users | GET | `/api/v1/super-admin/users?role={role}&status={status}` | `filterUsers()` |

#### Tasks

**3.1 Create User Service**
```typescript
// /src/services/userService.ts (NEW FILE)

import { api } from '@/lib/api'

export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  imageUrl: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export const userService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('v1/super-admin/users', { params })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`v1/super-admin/users/${id}`)
    return response.data
  },
  
  update: async (id: string, data: Partial<User>) => {
    const response = await api.patch(`v1/super-admin/users/${id}`, data)
    return response.data
  },
  
  suspend: async (id: string, reason: string) => {
    const response = await api.post(`v1/super-admin/users/${id}/suspend`, { reason })
    return response.data
  },
  
  activate: async (id: string) => {
    const response = await api.post(`v1/super-admin/users/${id}/activate`)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`v1/super-admin/users/${id}`)
    return response.data
  }
}
```

**3.2 Update User Page**
```typescript
// /src/app/mash-market/user/page.tsx

// REMOVE: const MOCK_USERS = [...]
// ADD: import { userService } from '@/services/userService'

const fetchUsers = async () => {
  setLoading(true)
  try {
    const data = await userService.getAll({ 
      page: currentPage, 
      limit: 10,
      search: searchQuery 
    })
    setUsers(data.users)
    setTotalPages(data.pagination.totalPages)
  } catch (error) {
    toast.error('Failed to load users')
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

**3.3 Preserve Existing UI**
- ✅ Keep all existing components: `UserActionsMenu`, `UserDetailsModal`, `StatusBadge`
- ✅ Keep search/filter UI exactly as is
- ✅ Keep pagination component
- ✅ Only change: data source (mock → API)

**3.4 Add Error Handling**
```typescript
// Add to user page
const [error, setError] = useState<string | null>(null)

// Show error state UI
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

---

### Phase 4: Seller Management Integration (Week 3)

**Current Status**: Uses `mockSellers` with localStorage in `/src/app/mash-market/seller/page.tsx`

#### Backend Endpoints Needed

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| List Sellers | GET | `/api/v1/super-admin/sellers` | With pagination |
| Get Seller | GET | `/api/v1/super-admin/sellers/:id` | Full details |
| Approve Seller | POST | `/api/v1/super-admin/sellers/:id/approve` | Change status to ACTIVE |
| Reject Seller | POST | `/api/v1/super-admin/sellers/:id/reject` | Include rejection reason |
| Suspend Seller | POST | `/api/v1/super-admin/sellers/:id/suspend` | Temporarily disable |
| Update Seller | PATCH | `/api/v1/super-admin/sellers/:id` | Edit seller info |
| Seller Stats | GET | `/api/v1/super-admin/sellers/:id/stats` | Orders, revenue, products |

#### Tasks

**4.1 Create Seller Service** (similar pattern to userService)

**4.2 Update Seller Page**
- [ ] Replace mock data with API calls
- [ ] Keep existing `SellerTable` component
- [ ] Keep existing `SellerActionMenu` component
- [ ] Add approval workflow UI
- [ ] Add rejection reason modal (use existing `RejectReasonModal`)

**4.3 Seller-Specific Features**
- [ ] Add seller verification status indicator
- [ ] Show pending seller count in navbar badge
- [ ] Add bulk approval action
- [ ] Implement seller activity timeline

---

### Phase 5: Product Management Integration (Week 3-4)

**Current Status**: Uses `MOCK_PRODUCTS` in `/src/app/mash-market/product/page.tsx`

#### Backend Endpoints Needed

| Action | Method | Endpoint | Frontend Component |
|--------|--------|----------|-------------------|
| List Products | GET | `/api/v1/super-admin/products` | Main product page |
| Get Product | GET | `/api/v1/super-admin/products/:id` | `ProductDetailsModal` |
| Approve Product | POST | `/api/v1/super-admin/products/:id/approve` | Action menu |
| Reject Product | POST | `/api/v1/super-admin/products/:id/reject` | `ProductRejectReasonModal` |
| Update Product | PATCH | `/api/v1/super-admin/products/:id` | Edit modal |
| Archive Product | DELETE | `/api/v1/super-admin/products/:id` | Soft delete |
| Product Images | GET | `/api/v1/super-admin/products/:id/images` | Image gallery |

#### Tasks

**5.1 Product Service**
- [ ] Create `/src/services/productService.ts`
- [ ] Handle product images (CDN URLs)
- [ ] Implement product approval workflow

**5.2 Update Product Components**
- [ ] `ProductTable` - use real data
- [ ] `ProductDetailsModal` - fetch full details
- [ ] Keep all existing modals and UI components

---

### Phase 6: Order Management Integration (Week 4)

**Current Status**: Uses `mockOrderLogs` in `/src/app/mash-market/order/page.tsx`

#### Backend Endpoints Needed

| Action | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| List Orders | GET | `/api/v1/super-admin/orders` | All orders with filters |
| Get Order | GET | `/api/v1/super-admin/orders/:id` | Full order details |
| Update Order Status | PATCH | `/api/v1/super-admin/orders/:id/status` | Change order status |
| Order Timeline | GET | `/api/v1/super-admin/orders/:id/timeline` | Status history |

#### Tasks

**6.1 Order Service**
- [ ] Create `/src/services/orderService.ts`
- [ ] Handle order status transitions
- [ ] Implement order filters (status, date range, seller)

**6.2 Update Order UI**
- [ ] Use existing `OrderLogsTable` component
- [ ] Update `OrderDetailsDrawer` with real data
- [ ] Keep existing status badges and filters

---

### Phase 7: CMS Integration (Week 4)

**Current Status**: Both MASH Market and MASH Grow CMS use mock data

#### Backend Endpoints Needed

| Action | Method | Endpoint | Section |
|--------|--------|----------|---------|
| List Content | GET | `/api/v1/super-admin/cms/content` | Both sections |
| Create Content | POST | `/api/v1/super-admin/cms/content` | CMS editor |
| Update Content | PATCH | `/api/v1/super-admin/cms/content/:id` | CMS editor |
| Delete Content | DELETE | `/api/v1/super-admin/cms/content/:id` | CMS table |
| Publish Content | POST | `/api/v1/super-admin/cms/content/:id/publish` | Status change |

#### Tasks

**7.1 CMS Service**
- [ ] Create `/src/services/cmsService.ts`
- [ ] Handle rich text content (HTML/Markdown)
- [ ] Implement content versioning

**7.2 Update CMS Pages**
- [ ] `/src/app/mash-market/cms/page.tsx`
- [ ] `/src/app/mash-grow/cms/page.tsx`
- [ ] Keep existing `ContentForm`, `ContentPreview`, `ContentTable`

---

### Phase 8: MASH Grow Integration (Week 4)

**Current Status**: Device and registered user pages use mock data

#### Backend Endpoints Needed

| Action | Method | Endpoint | Page |
|--------|--------|----------|------|
| List Devices | GET | `/api/v1/super-admin/devices` | Devices page |
| Create Device | POST | `/api/v1/super-admin/devices` | Create device modal |
| Update Device | PATCH | `/api/v1/super-admin/devices/:id` | Edit device |
| Assign Device | POST | `/api/v1/super-admin/devices/:id/assign` | Assign to user |
| Device Telemetry | GET | `/api/v1/super-admin/devices/:id/telemetry` | Device stats |
| List Grow Users | GET | `/api/v1/super-admin/grow-users` | Registered users |

#### Tasks

**8.1 Device Service**
- [ ] Create `/src/services/deviceService.ts`
- [ ] Handle device status updates
- [ ] Implement telemetry data fetching

**8.2 Update MASH Grow Pages**
- [ ] `/src/app/mash-grow/devices/page.tsx`
- [ ] `/src/app/mash-grow/registered-users/page.tsx`
- [ ] Keep existing modals: `CreateDeviceModal`, `AssignDeviceModal`

---

## 🔧 Technical Implementation Details

### 1. API Client Configuration

**File**: `/src/lib/api.ts` (already exists)

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/proxy', // Routes through our proxy
  withCredentials: true, // Include HttpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    // Access token from memory (not localStorage)
    const token = getAccessToken() // From auth store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Attempt token refresh
        await useAuthStore.getState().refreshAccessToken()
        
        // Retry original request
        const token = getAccessToken()
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - redirect to login
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)
```

### 2. Token Management Strategy

**In-Memory Access Token** (Security Best Practice)
```typescript
// /src/lib/tokenManager.ts (NEW FILE)

let accessToken: string | null = null
let tokenExpiry: number | null = null

export const setAccessToken = (token: string, expiresIn: number) => {
  accessToken = token
  tokenExpiry = Date.now() + (expiresIn * 1000)
}

export const getAccessToken = (): string | null => {
  // Check if token expired
  if (tokenExpiry && Date.now() >= tokenExpiry) {
    accessToken = null
    tokenExpiry = null
    return null
  }
  return accessToken
}

export const clearAccessToken = () => {
  accessToken = null
  tokenExpiry = null
}

// Auto-refresh before expiry
export const shouldRefreshToken = (): boolean => {
  if (!tokenExpiry) return false
  // Refresh 5 minutes before expiry
  return Date.now() >= (tokenExpiry - 5 * 60 * 1000)
}
```

**Refresh Token in HttpOnly Cookie** (Already Implemented)
- Set by `/src/app/api/auth/login/route.ts`
- Automatically sent with all requests
- Cannot be accessed by JavaScript (XSS protection)

### 3. Error Handling Pattern

**Create Global Error Handler**
```typescript
// /src/lib/errorHandler.ts (NEW FILE)

import { toast } from 'sonner'

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message || 'An error occurred'
    
    switch (status) {
      case 400:
        toast.error(message)
        break
      case 401:
        toast.error('Session expired. Please login again.')
        break
      case 403:
        toast.error('You do not have permission to perform this action.')
        break
      case 404:
        toast.error('Resource not found.')
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        toast.error(message)
    }
    
    return { status, message }
  }
  
  toast.error('An unexpected error occurred')
  return { status: 500, message: 'Unknown error' }
}

// Usage
try {
  await userService.update(id, data)
  toast.success('User updated successfully')
} catch (error) {
  handleApiError(error)
}
```

### 4. Loading States Pattern

**Consistent Loading UI Across All Pages**
```typescript
// Use existing skeleton components
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

const [loading, setLoading] = useState(true)

return (
  <>
    {loading ? (
      <DashboardSkeleton /> // or custom skeleton
    ) : (
      <YourContent />
    )}
  </>
)
```

### 5. Type Safety with TypeScript

**Define API Response Types**
```typescript
// /src/types/api.ts (NEW FILE)

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
  error: string
}

// Usage
const response: ApiResponse<User> = await api.get(`users/${id}`)
const users: PaginatedResponse<User> = await api.get('users')
```

---

## 🚨 Critical Issues to Resolve First

### 1. Missing Logger and Sentry Libraries **URGENT**

**Problem**: Code imports `@/lib/logger` and `@/lib/sentry` but files don't exist
**Impact**: Runtime errors in production
**Files Affected**: 6+ files (authStore, user/page, seller/page, product/page, layout)

**Solution A: Create Stub Implementations** (Recommended)
```typescript
// /src/lib/logger.ts (NEW FILE)
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, ...args)
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }
}

// /src/lib/sentry.ts (NEW FILE)
export const sentry = {
  setUser: (user: { id: string; email: string } | null) => {
    // Placeholder for future Sentry integration
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] User set:', user)
    }
  },
  addBreadcrumb: (message: string, category: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Breadcrumb] ${category}: ${message}`)
    }
  }
}
```

### 2. Standardize Backend Call Pattern

**Current Issue**: Two different patterns
1. Most pages: Use `/api/proxy` via `api` instance
2. Forgot password: Calls `process.env.NEXT_PUBLIC_API_URL` directly

**Decision Needed**:
- [ ] **Option A**: Use `/api/proxy` for everything (consistent, handles CORS)
- [ ] **Option B**: Direct calls for auth, proxy for protected resources
- [ ] **Option C**: Keep current hybrid approach

**Recommendation**: Option A (use proxy universally)

---

## 📋 Pre-Integration Checklist

### Backend API Verification
- [ ] Confirm all endpoints exist in production backend
- [ ] Test authentication flow end-to-end
- [ ] Verify JWT token format and expiry times
- [ ] Check CORS configuration on backend
- [ ] Test rate limiting behavior
- [ ] Document expected error responses

### Frontend Preparation
- [x] Create logger and sentry stub files ✅ **COMPLETED**
- [x] Set up error boundary components ✅ **COMPLETED**
- [ ] Create all service files (userService, productService, etc.)
- [x] Set up TypeScript types for API responses ✅ **COMPLETED**
- [x] Configure axios interceptors for token refresh ✅ **COMPLETED**
- [ ] Test `/api/proxy` with real backend

### Environment Configuration
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
NODE_ENV=development

# .env.production (Vercel)
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
NODE_ENV=production
```

---

## 🧪 Testing Strategy

### 1. Unit Testing (Per Service)
```bash
# Example: Test userService
npm run test src/services/userService.test.ts
```

### 2. Integration Testing
- [ ] Test login flow with real backend
- [ ] Test token refresh mechanism
- [ ] Test CRUD operations for each entity
- [ ] Test error handling (network errors, 401, 403, 500)
- [ ] Test rate limiting behavior

### 3. Manual Testing Checklist
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Register new account
- [ ] Verify email with 6-digit code
- [ ] Forgot password flow (request → verify → reset)
- [ ] Navigate all dashboard sections
- [ ] Test search and filters on all pages
- [ ] Test pagination
- [ ] Test CRUD operations (create, read, update, delete)
- [ ] Test logout and session expiry

---

## 🚀 Deployment Steps

### 1. Staging Environment
```bash
# Deploy to Vercel preview branch
git checkout -b backend-integration
git push origin backend-integration
# Vercel auto-deploys preview: https://mash-admin-dashboard-{branch}.vercel.app
```

### 2. Environment Variables (Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
```

### 3. Production Deployment
```bash
# After testing in staging
git checkout main
git merge backend-integration
git push origin main
# Production: https://mash-admin-dashboard-ashy.vercel.app
```

### 4. Post-Deployment Testing
- [ ] Test `/diagnostics` page
- [ ] Verify backend connectivity
- [ ] Test authentication flow
- [ ] Check cookie handling in production
- [ ] Monitor error logs (Vercel dashboard)

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Zero mock data in production
- ✅ All API endpoints connected
- ✅ Token refresh working automatically
- ✅ Error handling for all failure scenarios
- ✅ Loading states on all data-fetching pages

### User Experience Metrics
- ✅ No design changes (UI identical to current)
- ✅ Page load time < 2 seconds
- ✅ Search/filter response time < 500ms
- ✅ Smooth pagination (no jank)
- ✅ Clear error messages

### Security Metrics
- ✅ Access tokens in memory only (not localStorage)
- ✅ Refresh tokens in HttpOnly cookies
- ✅ All API calls include authentication
- ✅ 401/403 errors handled gracefully
- ✅ Rate limiting respected

---

## 🆘 Troubleshooting Guide

### Issue: 401 Unauthorized on all requests
**Cause**: Access token missing or expired
**Solution**:
1. Check if login sets token: `getAccessToken()` in console
2. Verify Authorization header: Check Network tab in DevTools
3. Test token refresh: Wait for expiry and make request
4. Check backend logs for token validation errors

### Issue: CORS errors
**Cause**: Backend not allowing frontend origin
**Solution**:
1. Verify `vercel.json` has CORS headers
2. Check backend CORS configuration
3. Use `/api/proxy` instead of direct calls
4. Test with `curl` to isolate issue

### Issue: Token refresh loop
**Cause**: Refresh token also expired
**Solution**:
1. Check refresh token expiry (7 days)
2. Force logout and re-login
3. Clear all cookies
4. Check backend session management

### Issue: Data not loading
**Cause**: API response structure mismatch
**Solution**:
1. Log API response: `console.log(response.data)`
2. Check TypeScript types match backend
3. Verify endpoint path is correct
4. Test endpoint with Postman/curl

---

## 📞 Support Contacts

### Backend Team
- **API Documentation**: [Provide link]
- **Slack Channel**: #backend-support
- **Email**: backend-team@mash.com

### Frontend Team
- **Repository**: https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard
- **Issues**: Create GitHub issue with `backend-integration` label

---

## 🎯 Next Steps

1. **Review this document** with team
2. **Get backend team confirmation** on endpoint availability
3. **Create GitHub issues** for each phase (use this doc as spec)
4. **Set up staging environment** for testing
5. **Start Phase 1** (Authentication) this week

**Estimated Timeline**: 3-4 weeks (assuming backend endpoints exist)
**First Milestone**: Complete authentication integration by end of Week 1

---

## ✅ Definition of Done

For each integration phase:
- [ ] All mock data replaced with API calls
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] TypeScript types defined
- [ ] Service layer created
- [ ] Manual testing completed
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] QA approved
- [ ] Merged to main
