# MASH Admin Dashboard - AI Coding Guidelines

## Architecture Overview

**MASH Admin Dashboard** is a Next.js 15 (App Router) admin interface for mushroom automation systems managing two business domains:

- **MASH Market**: E-commerce (users, sellers, orders, products, CMS)
- **MASH Grow**: Cultivation management (devices, registered users, CMS)

**Critical Architecture Decision**: This is a frontend-only app that proxies ALL backend requests through `/api/proxy/*` to avoid CORS issues. The backend API (`NEXT_PUBLIC_API_URL`) is a separate Railway-hosted service.

### Tech Stack
- **Framework**: Next.js 15 App Router with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand with `persist` middleware (auth/dashboard stores)
- **HTTP Client**: Axios instance at `/src/lib/api.ts` (baseURL: `/api/proxy`)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Critical File Reference

| File | Purpose | When to Check |
|------|---------|---------------|
| `/middleware.ts` | Auth guard for `/dashboard/*` routes - checks `authToken` cookie | Authentication issues, redirect loops |
| `/src/lib/api.ts` | Axios instance pre-configured to use `/api/proxy` endpoint | All API calls must go through this |
| `/src/store/authStore.ts` | Auth state + login logic - stores user object only (NOT tokens) | Login flow, logout behavior |
| `/src/app/api/proxy/[...path]/route.ts` | Universal proxy handler - extracts `authToken` cookie and forwards as Bearer token | Backend communication, CORS issues |
| `/src/app/api/auth/login/route.ts` | Login endpoint - sets HttpOnly cookies for auth tokens | Login implementation |
| `/components.json` | shadcn/ui config - defines `@/*` path aliases | Import resolution issues |
| `/src/components/sidebar.tsx` | Navigation structure + user menu (370 lines) | Adding new routes/pages |

## Authentication Architecture (Critical!)

**The auth flow is split between client state and HttpOnly cookies:**

1. **Login** (`/src/app/api/auth/login/route.ts`):
   - Forwards credentials to backend `/api/v1/auth/login`
   - Backend returns `{ accessToken, refreshToken, user }`
   - Sets HttpOnly cookies: `authToken` (1 day), `refreshToken` (30 days)
   - Returns ONLY `user` object to client (no tokens exposed)

2. **Middleware** (`/middleware.ts`):
   - Checks for `authToken` cookie on `/dashboard/*` requests
   - Redirects to `/login` if missing
   - Cookie is HttpOnly → JavaScript cannot read it (this is correct!)

3. **API Calls** (`/src/lib/api.ts` + `/src/app/api/proxy/[...path]/route.ts`):
   - Frontend calls `/api/proxy/v1/super-admin/...`
   - Proxy extracts `authToken` from cookies
   - Forwards to backend as `Authorization: Bearer <token>`

4. **State** (`/src/store/authStore.ts`):
   - Persists user object to localStorage (NOT tokens)
   - Login verification pattern: Check stored user → verify cookie with `/api/auth/verify`
   - Logout: POST to `/api/auth/logout` (clears cookies) + clear Zustand state

**Key Insight**: If you see auth issues, check both Zustand state AND cookie presence. User in store without valid cookie causes redirect loops.

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
npm run build        # Production build with Turbopack
npm run start        # Start production server
```

**Port 3001 is hardcoded** in `package.json` to avoid conflicts. Backend typically runs on 3000.

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
```
Must be set in `.env.local` (dev) and Vercel dashboard (production). This is the ONLY env var used.

### Build Configuration Quirks
- **ESLint disabled during builds**: `next.config.ts` sets `eslint.ignoreDuringBuilds: true` to prevent CI failures
- **Runtime mode**: API routes use `dynamic = 'force-dynamic'` to prevent static generation
- **Turbopack**: Build command explicitly uses `--turbopack` flag

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
2. Must include: `export const dynamic = 'force-dynamic'`
3. Forward to backend via `NEXT_PUBLIC_API_URL`
4. Extract/forward cookies manually if needed

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
3. ✅ Build command: `npm run build` (uses Turbopack)
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

### Missing Features (See `DEVELOPMENT_ROADMAP.md`)
- No error boundaries (app crashes propagate)
- No test files (Jest configured but unused)
- No real-time updates (WebSocket not implemented)
- No role-based access control (all users see everything)
- No data export (CSV/PDF/Excel)
- Settings page doesn't persist to backend
- Forgot password flow incomplete

### Code Smells to Watch
- Large files: `sidebar.tsx` (370 lines), user pages (457 lines)
- Inconsistent loading states (some pages have skeletons, others don't)
- Some forms use Zod validation, others don't
- Mix of `fetch()` and `api.get()` calls (should standardize on `api` instance)

## Development Roadmap

**See `DEVELOPMENT_ROADMAP.md`** for comprehensive improvement list covering:
- 30+ identified issues/features
- Prioritized implementation phases (10-12 weeks estimated)
- Quick wins (< 1 day each)
- Security improvements needed
- Missing pages per business domain

### Immediate Priorities (Make Production-Ready)
1. Replace mock data with real API calls
2. Add error boundaries
3. Implement proper logging/monitoring (Sentry)
4. Add role-based access control
5. Complete backend integration for all CRUD operations</content>
<parameter name="filePath">c:\Users\Kenneth\Desktop\PP Namias\MASH-Admin-Dashboard\.github\copilot-instructions.md