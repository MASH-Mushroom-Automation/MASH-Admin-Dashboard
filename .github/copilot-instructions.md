# MASH Admin Dashboard - AI Coding Guidelines

## Deployment URLs

**Production Deployments:**
- **Admin Dashboard (Railway)**: https://mash-admin-dashboard-production.up.railway.app
- **Admin Dashboard (Vercel)**: https://mash-admin-dashboard-ashy.vercel.app
- **Backend API**: https://mash-backend-production.up.railway.app
- **Firebase Console**: https://console.firebase.google.com/u/7/project/mash-ddf8d
- **Sanity Studio**: https://www.sanity.io/organizations/oBQP4vpxm/project/gerattrr

**Test Credentials:**
- Email: mash.mushroom.automation@gmail.com
- Password: PP@Namias99

---

## Architecture Overview

**MASH Admin Dashboard** is a Next.js 15 (App Router) admin interface for mushroom automation systems managing two business domains:

- **MASH Market**: E-commerce (users, sellers, orders, products, CMS)
- **MASH Grow**: Cultivation management (devices, registered users, CMS)

**Critical Architecture Decision**: This is a frontend-only app that proxies ALL backend requests through `/api/proxy/*` to avoid CORS issues. The backend API (`NEXT_PUBLIC_API_URL`) is a separate Railway-hosted service at `https://mash-backend-production.up.railway.app`.

### Tech Stack
- **Framework**: Next.js 15 App Router with React 19 (runs on port **3001**, not 3000)
- **Language**: TypeScript (strict mode, but ESLint disabled in builds)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand with `persist` middleware (auth/dashboard stores)
- **HTTP Client**: Axios instance at `/src/lib/api.ts` (baseURL: `/api/proxy`)
- **Forms**: React Hook Form + Zod validation
- **Toast Notifications**: Sonner (NOT custom modals or alert())
- **Icons**: Lucide React
- **Token Management**: In-memory access tokens via `/src/lib/tokenManager.ts` (NOT localStorage)

## Critical File Reference

| File | Purpose | When to Check |
|------|---------|---------------|
| `/src/middleware.ts` | Auth guard for `/dashboard/*` routes - checks `refreshToken` cookie | Authentication issues, redirect loops |
| `/src/lib/api.ts` | Axios instance pre-configured to use `/api/proxy` endpoint | All API calls must go through this |
| `/src/store/authStore.ts` | Auth state + login/logout/forgotPassword logic - stores user object only (NOT tokens) | Login flow, logout behavior, password reset |
| `/src/app/api/proxy/[...path]/route.ts` | Universal proxy handler - extracts `authToken` cookie and forwards as Bearer token | Backend communication, CORS issues |
| `/src/app/api/auth/login/route.ts` | Login endpoint - calls backend API and sets HttpOnly cookies for auth tokens | Login implementation |
| `/components.json` | shadcn/ui config - defines `@/*` path aliases | Import resolution issues |
| `/src/components/sidebar.tsx` | Navigation structure + user menu (370 lines) | Adding new routes/pages |
| `/vercel.json` | API route rewrites + CORS headers for deployment | Deployment issues |

## Authentication Architecture (Critical!)

**Dual Token System**: Access tokens in memory (XSS protection) + refresh tokens in HttpOnly cookies (CSRF protection).

### Auth Flow Components

1. **Login** (`/src/app/api/auth/login/route.ts`):
   - Calls backend `POST /api/v1/auth/login` with email and password
   - Backend response: `{ success, data: { accessToken, refreshToken, user } }`
   - Returns access token in response body (stored in memory by client)
   - Sets refresh token in HttpOnly cookie (secure storage)
   - Token expiry: Access token 1 hour, Refresh token 7 days

2. **Token Manager** (`/src/lib/tokenManager.ts`):
   - In-memory access token storage with expiry tracking
   - `setAccessToken(token, expiresIn)` - stores with timestamp
   - `getAccessToken()` - returns null if expired
   - `shouldRefreshToken()` - true if <5 min remaining
   - **NEVER uses localStorage** (XSS vulnerability)

3. **Registration Flow** (`/src/app/register/` + `/verify`):
   - Calls backend `POST /api/v1/auth/register` with user details
   - Backend sends verification email with code
   - Step 1: Register → backend sends code via email
   - Step 2: Verify code → backend returns success message
   - Uses `sessionStorage.setItem('registerEmail', email)` between steps
   - Direct backend calls to `NEXT_PUBLIC_API_URL`

4. **Forgot Password Flow** (`/src/app/forgot-password/`):
   - **3-step wizard**: `/forgot-pass` → `/verify` → `/reset`
   - Same 6-digit code pattern as registration (10min expiry, 5 attempts max)
   - `sessionStorage.setItem('resetEmail', email)` for persistence between steps
   - **LOCALHOST ONLY**: Uses `http://localhost:3000` (NOT production URL) for all endpoints
   - Endpoints: `forgot-password`, `verify-reset-code`, `reset-password`, `resend-password-reset-code`
   - Rate limiting: 3 requests per 5 minutes, 1-minute resend cooldown
   - Enhanced toast notifications with loading states and detailed error messages

5. **Middleware Guard** (`/src/middleware.ts`):
   - Protects `/dashboard/*` routes only
   - Checks `refreshToken` cookie existence (HttpOnly → JS can't read it)
   - No cookie → redirect to `/login`

6. **API Proxy** (`/src/app/api/proxy/[...path]/route.ts`):
   - Universal handler for backend communication
   - Extracts `authToken` from cookies
   - Forwards as `Authorization: Bearer <token>` header
   - Frontend: `api.get('v1/super-admin/...')` → Proxy: `GET ${BACKEND_URL}/api/v1/super-admin/...`

7. **Auth Store** (`/src/store/authStore.ts`):
   - Persists user object to localStorage (Zustand persist middleware)
   - Logout: `fetch('/api/auth/logout')` + clear state
   - ⚠️ Imports non-existent `@/lib/logger` and `@/lib/sentry` (known issue)

**Debugging Auth Issues**:
- Check both: Zustand state (`useAuthStore`) AND cookie (`refreshToken` in DevTools → Application → Cookies)
- User in store but no cookie = redirect loop
- Cookie present but no user in store = lost session state (refresh page)

## Next.js 15 Breaking Changes

**All dynamic route `params` are now async**. Example fix pattern:
```tsx
// ❌ Old (breaks in Next.js 15)
export default function Page({ params }: { params: { id: string } }) {
  const user = MOCK_USERS.find(u => u.id === params.id)
}

// ✅ New (Next.js 15 compatible)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = MOCK_USERS.find(u => u.id === id)
}
```
All dynamic route pages under `/mash-market/` and `/mash-grow/` already follow this pattern.

## Development Workflow

### Local Development Commands
```bash
npm run dev          # Starts on port 3001 (note: NOT 3000)
npm run build        # Production build (WITHOUT Turbopack - removed from build script)
npm run start        # Start production server
npm run lint         # ESLint (disabled during builds via next.config.ts)
```

**Port 3001 is hardcoded** in `package.json` to avoid conflicts. Backend typically runs on 3000.

**Build Configuration**: ESLint is disabled during builds (`ignoreDuringBuilds: true` in `package.json` and `next.config.ts`) to prevent CI failures. Turbopack was removed from build script due to stability issues.

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
```
Must be set in `.env.local` (dev) and Vercel dashboard (production). This is the ONLY env var used.

**⚠️ EXCEPTION: Forgot Password Flow**
- The forgot password feature uses `http://localhost:3000` hardcoded in all three step pages
- This is intentional to test against local backend during development
- All other features use the production `NEXT_PUBLIC_API_URL`
- Location: `/src/app/forgot-password/forgot-pass/`, `/verify/`, `/reset/`

### Build Configuration Quirks
- **ESLint disabled during builds**: Both `package.json` (`eslint.ignoreDuringBuilds: true`) and `next.config.ts` disable linting to prevent CI failures
- **Runtime mode**: All API routes MUST use `export const dynamic = 'force-dynamic'` to prevent static generation (causes cookie issues)
- **Turbopack removed**: Build script uses standard webpack (Turbopack had stability issues)
- **API Route Pattern**: All routes must use `export const runtime = 'nodejs'` for full Node.js API access

## Common Patterns

### Standard Page Layout (All Admin Pages)
```tsx
"use client" // Required - all pages use state/hooks

export default function PageName() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">{/* Content */}</main>
      </div>
    </div>
  )
}
```

### API Calls (Use `api` instance from `/src/lib/api.ts`)
```tsx
import { api } from '@/lib/api'

// ✅ Correct - goes through proxy automatically
const res = await api.get('v1/super-admin/dashboard/overview')

// ❌ Wrong - bypasses proxy, causes CORS errors
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/...`)
```

The `api` instance has `baseURL: '/api/proxy'` and `withCredentials: true` pre-configured.

### Adding New Backend-Connected API Routes
1. Create in `/src/app/api/` (only if NOT using universal proxy)
2. **MUST include both**:
   ```typescript
   export const runtime = 'nodejs'
   export const dynamic = 'force-dynamic'
   ```
3. Forward to backend via `NEXT_PUBLIC_API_URL`
4. Extract/forward cookies manually if needed (see `/api/proxy` for pattern)

Most cases should use the existing `/api/proxy/[...path]` handler.

### Mock Data Pattern (Many Pages Use This)
- **User pages**: `MOCK_USERS` constant with 5-10 sample users
- **Product pages**: `MOCK_PRODUCTS` with sample items
- **Seller pages**: `mockSellers` with localStorage persistence
- Pattern: Check localStorage first → fallback to MOCK constant → filter/search locally

Example: `/src/app/mash-market/user/page.tsx` uses `MOCK_USERS` for all data (457 lines).

### Zustand Store Pattern (See `/src/store/dashboardStore.ts`)
```tsx
export const useDashboardStore = create<State>()(
  devtools((set, get) => ({
    data: null,
    loading: {},
    error: {},
    
    fetchData: async () => {
      set({ loading: { ...get().loading, data: true } })
      try {
        const res = await api.get('v1/endpoint')
        set({ data: res.data })
      } catch (err) {
        set({ error: { data: err.message } })
      } finally {
        set({ loading: { ...get().loading, data: false } })
      }
    }
  }))
)
```
Loading/error states are keyed objects for granular control.

### Multi-Step Wizard Pattern (Forgot Password)
**Location**: `/src/app/forgot-password/` with 3 separate route subdirectories

**State Persistence**: Uses `sessionStorage` to pass data between steps (NOT query params or Zustand)
```tsx
// Step 1: Request reset (forgot-pass/page.tsx)
sessionStorage.setItem('resetEmail', email)
router.push('/forgot-password/verify')

// Step 2: Verify OTP (verify/page.tsx)
const email = sessionStorage.getItem('resetEmail')
if (!email) router.push('/forgot-password') // Guard

// Step 3: Reset password (reset/page.tsx)
const email = sessionStorage.getItem('resetEmail')
// ... after success:
sessionStorage.removeItem('resetEmail')
```

**Key Characteristics**:
- Each step is a separate route with its own page.tsx
- Uses React Hook Form + Zod for all forms
- Sonner toasts for feedback (NOT alert() or custom modals)
- Direct backend calls to `NEXT_PUBLIC_API_URL` (bypasses `/api/proxy`)
- Layout wrapper at `/forgot-password/layout.tsx` provides consistent UI

## Path Aliases (Defined in `tsconfig.json` + `components.json`)
```tsx
import Sidebar from '@/components/sidebar'      // ✅
import { api } from '@/lib/api'                  // ✅
import { Button } from '@/components/ui/button'  // ✅
```

## shadcn/ui Components (`/src/components/ui/`)
- **Never modify files in `/components/ui/`** - they're managed by shadcn CLI
- Add new components: `npx shadcn@latest add <component-name>`
- Customize via `components.json` or by wrapping (not editing directly)
- Use `cn()` utility from `/src/lib/utils.ts` to merge Tailwind classes

## Deployment (Vercel)

### Pre-deployment Checklist
1. ✅ Environment var `NEXT_PUBLIC_API_URL` set in Vercel dashboard
2. ✅ `vercel.json` exists with API route rewrites (already configured)
3. ✅ Build command: `npm run build` (uses webpack, NOT Turbopack)
4. ✅ All dynamic routes use `await params` pattern

### Testing Deployment
Visit `/diagnostics` page after deployment - it checks:
- Backend connectivity
- Environment variable configuration
- Cookie handling
- Test login flow

Production URL: `https://mash-admin-dashboard-ashy.vercel.app`

## Common Pitfalls

1. **Forgetting `"use client"`**: Pages using hooks/state MUST include directive
2. **Bypassing proxy**: Always use `api` instance, never direct fetch to backend
3. **Cookie debugging**: HttpOnly cookies won't show in `document.cookie` - this is expected
4. **Dynamic params**: Remember to `await params` in Next.js 15 dynamic routes
5. **Port conflicts**: Frontend runs on 3001 (not default 3000)

## Critical Debugging Workflows

### When Login Fails
1. Check `/diagnostics` page for backend connectivity
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local` and Vercel dashboard
3. Test hardcoded admin: `mash.mushroom.automation@gmail.com / PP@Namias99`
4. Check browser DevTools → Network → `/api/auth/login` response
5. Verify cookies set: Application → Cookies → `authToken` and `refreshToken`

### When API Calls Fail
1. Verify using `api` instance from `/src/lib/api.ts` (NOT raw fetch)
2. Check proxy logs in terminal: `[PROXY] GET → https://...`
3. Ensure route doesn't start with `/api/` (should be `v1/...`)
4. Verify `authToken` cookie exists (middleware check)
5. Test direct backend call: `/api/test-backend`

### When Build Fails
1. Check for `await params` in all dynamic routes (`/[id]/page.tsx`)
2. Verify no TypeScript errors (though ESLint is disabled)
3. Remove `.next/` folder and rebuild: `del .next /s /q && npm run build`
4. Check for missing imports (logger, sentry - known issues)

## Known Limitations & Technical Debt

### Mock Data Usage
- **Current State**: Most pages (users, products, sellers, orders) use `MOCK_*` constants with localStorage
- **Pattern**: Check `localStorage` → fallback to MOCK constant → filter/search client-side
- **Files affected**: 
  - `src/app/mash-market/user/page.tsx` (MOCK_USERS, 457 lines)
  - `src/app/mash-market/seller/page.tsx` (mockSellers + localStorage)
  - `src/app/mash-market/product/` (MOCK_PRODUCTS)
  - `src/app/mash-market/order/page.tsx` (mockOrderLogs)
- **Note**: Real API integration exists only for dashboard overview/stats

### Missing Utility Libraries
- **Logger/Sentry**: Code imports `@/lib/logger` and `@/lib/sentry` but these files DON'T EXIST
  - Used in: `authStore.ts`, `user/page.tsx`, `seller/page.tsx`, `product/page.tsx`, `layout.tsx`
  - Pattern: `logger.info()`, `logger.error()`, `sentry.setUser()`, `sentry.addBreadcrumb()`
  - **Action needed**: Create stub implementations or remove imports to prevent runtime errors

### Missing Features
- No error boundaries (app crashes propagate)
- No test files (Jest configured but unused)
- No real-time updates (WebSocket not implemented)
- No role-based access control (all users see everything)
- No data export (CSV/PDF/Excel)
- Settings page doesn't persist to backend

### Code Smells to Watch
- Large files: `sidebar.tsx` (370 lines), user pages (457 lines)
- Inconsistent loading states (some pages have skeletons, others don't)
- Some forms use Zod validation, others don't
- Mix of `fetch()` and `api.get()` calls (should standardize on `api` instance)
- **Two different patterns for backend calls**:
  - Most pages: Use `/api/proxy` via `api` instance from `@/lib/api.ts`
  - Forgot password flow: Calls `process.env.NEXT_PUBLIC_API_URL` directly

## Build & Deployment Resources

### Reference Documentation
- **BUILD_STATUS.md**: Current build status, completed fixes, Next.js 15 migration notes
  - Documents async `params` fixes for all dynamic routes
  - ESLint/Turbopack configuration decisions
  - Merge conflict resolutions
- **DEPLOYMENT_GUIDE.md**: Step-by-step Vercel deployment instructions
  - Environment variable setup
  - CORS configuration
  - Diagnostic tools (`/diagnostics` page, `/api/test-backend`)
  - Production URL: `https://mash-admin-dashboard-ashy.vercel.app`
- **BACKEND_INTEGRATION_PLAN.md**: Complete roadmap for connecting to production backend
  - 8-phase integration plan (3-4 weeks estimated)
  - Authentication system upgrade (6-digit code verification)
  - Service layer architecture for all entities (users, sellers, products, orders)
  - Token management strategy (in-memory access tokens + HttpOnly refresh tokens)
  - Error handling patterns and TypeScript type definitions
  - Testing strategy and deployment checklist

### Immediate Priorities (Make Production-Ready)
1. **Fix missing logger/sentry libs**: Create stub implementations in `/src/lib/` or remove all imports
2. Replace mock data with real API calls
3. Add error boundaries
4. Implement proper logging/monitoring (Sentry)
5. Add role-based access control
6. Complete backend integration for all CRUD operations</content>
<parameter name="filePath">c:\Users\Kenneth\Desktop\PP Namias\MASH-Admin-Dashboard\.github\copilot-instructions.md