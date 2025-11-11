# MASH Admin Dashboard - Development Roadmap

> **Generated**: November 11, 2025  
> **Purpose**: Comprehensive list of missing features, improvements, and technical debt

---

## 🔴 Critical Issues (Must Fix)

### 1. **No Error Boundaries**
- **Status**: ❌ Missing
- **Impact**: Crashes cascade and break entire UI
- **Action**:
  - Add React Error Boundary wrapper at app level
  - Create error boundary for each major section (Market, Grow, Dashboard)
  - Log errors to monitoring service
- **Files to create**: `src/components/error-boundary.tsx`

### 2. **No Real Testing Infrastructure**
- **Status**: ❌ No test files found
- **Impact**: No confidence in deployments, risk of regressions
- **Action**:
  - Set up Jest + React Testing Library (already in package.json)
  - Write unit tests for Zustand stores
  - Integration tests for auth flow
  - E2E tests for critical paths (login → dashboard)
- **Files to create**: `src/**/__tests__/`, `jest.config.js`, `jest.setup.js`

### 3. **Mock Data Everywhere**
- **Status**: ⚠️ 90% of pages use local mock data
- **Impact**: Not production-ready, localStorage data inconsistency
- **Action**:
  - Replace MOCK_USERS with real API calls to `/api/proxy/v1/super-admin/users`
  - Replace MOCK_PRODUCTS with backend integration
  - Remove localStorage persistence layer for sellers/products
  - Add proper data fetching with loading states
- **Files to refactor**: 
  - `src/app/mash-market/user/page.tsx` (457 lines)
  - `src/app/mash-market/product/page.tsx`
  - `src/app/mash-market/seller/page.tsx`

### 4. **No Logging/Monitoring**
- **Status**: ❌ Console.log only
- **Impact**: No visibility into production errors, debugging nightmare
- **Action**:
  - Integrate Sentry for error tracking
  - Add structured logging service
  - Track auth failures, API errors, user actions
- **Files to create**: `src/lib/logger.ts`, `src/lib/sentry.ts`

---

## 🟠 High Priority Features

### 5. **No Real-time Updates**
- **Status**: ❌ No WebSocket/SSE implementation
- **Impact**: Dashboard data is stale, manual refresh required
- **Action**:
  - Add WebSocket client for chamber status updates
  - Real-time order notifications
  - Live seller application updates
- **Files to create**: `src/lib/websocket.ts`, `src/hooks/useRealtimeData.ts`

### 6. **Incomplete Authentication**
- **Status**: ⚠️ Basic auth only, no RBAC
- **Issues**:
  - No role-based access control (all users see everything)
  - No permission system
  - Missing features:
    - Email verification flow (partially implemented but not integrated)
    - Password reset (exists but not tested)
    - Session timeout handling
    - Refresh token rotation
- **Action**:
  - Add permission middleware
  - Create role-based route guards
  - Implement proper session management
- **Files to modify**: `/middleware.ts`, `src/store/authStore.ts`

### 7. **No Data Export Functionality**
- **Status**: ❌ Missing
- **Impact**: Users cannot export reports/data
- **Action**:
  - Add CSV export for user lists, orders, products
  - PDF report generation for sales/analytics
  - Excel export with formatting
- **Files to create**: `src/lib/export.ts`, API routes for data export

### 8. **Missing Search & Filtering Backend Integration**
- **Status**: ⚠️ Client-side only
- **Impact**: Cannot scale beyond 100s of records
- **Action**:
  - Move search to backend with query params
  - Add debounced search
  - Implement server-side pagination
  - Add advanced filtering (date ranges, multi-select)
- **Files to modify**: All list pages (`user/page.tsx`, `order/page.tsx`, etc.)

### 9. **No Image Upload/Management**
- **Status**: ❌ Product images are static URLs
- **Impact**: Cannot add/update product images
- **Action**:
  - Integrate with cloud storage (S3, Cloudinary)
  - Add image upload component with preview
  - Image optimization pipeline
  - Multi-image upload for products
- **Files to create**: `src/components/image-upload.tsx`, `src/lib/storage.ts`

---

## 🟡 Medium Priority Improvements

### 10. **Accessibility Issues**
- **Status**: ⚠️ Minimal ARIA labels
- **Impact**: Not usable for screen readers
- **Action**:
  - Add proper ARIA labels to all interactive elements
  - Keyboard navigation support
  - Focus management in modals/drawers
  - Color contrast audit
- **Files to audit**: All component files

### 11. **Performance Optimization**
- **Status**: ⚠️ No code splitting beyond Next.js defaults
- **Action**:
  - Add React.lazy() for large components
  - Implement virtual scrolling for long tables
  - Optimize bundle size (current: unknown)
  - Add performance monitoring
  - Image optimization (Next.js Image already used but inconsistently)
- **Files to create**: `src/hooks/useVirtualScroll.ts`

### 12. **Inconsistent Loading States**
- **Status**: ⚠️ Some pages have skeletons, others don't
- **Action**:
  - Standardize loading UI across all pages
  - Use dashboard skeleton pattern everywhere
  - Add optimistic UI updates
- **Files to create**: `src/components/skeletons/` directory

### 13. **No Form Validation Consistency**
- **Status**: ⚠️ Some forms use Zod, others don't
- **Action**:
  - Apply Zod schemas to ALL forms
  - Add consistent error messaging
  - Field-level validation feedback
- **Files to audit**: Login, forgot password, settings, CMS forms

### 14. **Missing Notification System**
- **Status**: ⚠️ Using toast only
- **Action**:
  - Add notification center/inbox
  - Persist notifications
  - Mark as read functionality
  - Push notification support (PWA)
- **Files to create**: `src/components/notification-center.tsx`

### 15. **No API Rate Limiting/Retry Logic**
- **Status**: ❌ Direct fetch calls, no retry
- **Action**:
  - Add exponential backoff for failed requests
  - Rate limit handling
  - Request cancellation on component unmount
  - Queue for offline support
- **Files to modify**: `src/lib/api.ts`

### 16. **Incomplete Settings Page**
- **Status**: ⚠️ Basic form, no backend integration
- **Issues**:
  - Form submits but doesn't save to backend
  - No two-factor authentication implementation
  - No notification preferences backend
  - Password change not connected
- **Files to modify**: `src/app/settings/page.tsx`

---

## 🟢 Nice-to-Have Features

### 17. **Analytics Dashboard**
- Add charts for:
  - Sales trends over time
  - Top-selling products
  - User growth
  - Device connection metrics
  - Revenue per seller
- **Library**: Already using Recharts

### 18. **Bulk Operations**
- Bulk user actions (activate/deactivate)
- Bulk product approval/rejection
- Bulk order status updates
- **Pattern**: Add checkbox selection to tables

### 19. **Advanced Filtering**
- Date range pickers for all list views
- Multi-select filters
- Save filter presets
- Filter chips with clear-all

### 20. **Audit Logs**
- Track all admin actions
- Who approved/rejected what
- User activity timeline
- Exportable logs

### 21. **Dark Mode (Proper)**
- Currently has theme setup but incomplete
- Ensure all custom components support dark mode
- Persist theme preference

### 22. **Multi-language Support (i18n)**
- Currently hardcoded English
- Add i18next
- Support Filipino/Tagalog

### 23. **Progressive Web App (PWA)**
- Add manifest.json
- Service worker for offline support
- Install prompt

### 24. **Advanced Order Management**
- Order tracking with status timeline
- Shipping integration
- Invoice generation
- Refund workflow

### 25. **Seller Analytics**
- Per-seller dashboard
- Sales metrics
- Product performance
- Customer reviews

---

## 🔧 Technical Debt

### 26. **Code Organization**
- **Issue**: 370-line sidebar.tsx, 457-line user page
- **Action**: Break into smaller components
- **Target**: Max 200 lines per file

### 27. **TypeScript Strictness**
- **Issue**: `any` types in several places
- **Action**: Enable `no-explicit-any` lint rule
- **Files to audit**: All components with `any`

### 28. **Environment Variable Management**
- **Issue**: Only one env var, hardcoded values elsewhere
- **Action**: Move all config to .env
  - Backend URL
  - Feature flags
  - API keys
  - Environment-specific settings

### 29. **API Response Types**
- **Issue**: No shared types between frontend/backend
- **Action**: Generate TypeScript types from OpenAPI spec or share types package

### 30. **Unused Dependencies**
- **Action**: Run `npx depcheck` and remove unused packages
- **Potential**: framer-motion (installed but barely used)

---

## 📊 Missing Pages/Features

### MASH Market (E-commerce)
- ✅ Users list & details
- ✅ Sellers list & details
- ✅ Orders list
- ✅ Products list & details
- ✅ CMS (basic)
- ❌ **Missing**:
  - Inventory management
  - Shipping zones/rates
  - Tax configuration
  - Coupon/discount management
  - Customer support tickets
  - Seller payouts
  - Reviews/ratings moderation

### MASH Grow (Cultivation)
- ✅ Devices list
- ✅ Registered users
- ✅ CMS (basic)
- ❌ **Missing**:
  - Chamber monitoring dashboard (real-time metrics)
  - Harvest logs
  - Growth cycle tracking
  - Environmental alerts
  - Device analytics
  - Maintenance schedules
  - Sensor calibration

### Admin Features
- ✅ Dashboard overview
- ✅ Settings (partial)
- ❌ **Missing**:
  - User roles management
  - Admin user management
  - System logs
  - API documentation page
  - Backup/restore
  - System health status

---

## 🚀 Recommended Implementation Order

### Phase 1: Foundation (Weeks 1-2)
1. Add error boundaries
2. Set up proper testing infrastructure
3. Implement logging/monitoring (Sentry)
4. Replace mock data with real API calls

### Phase 2: Core Features (Weeks 3-4)
5. Role-based access control
6. Data export functionality
7. Image upload/management
8. Real-time updates (WebSocket)

### Phase 3: UX Improvements (Weeks 5-6)
9. Consistent loading states
10. Advanced search/filtering
11. Notification center
12. Performance optimization

### Phase 4: Feature Completeness (Weeks 7-8)
13. Complete all missing pages
14. Bulk operations
15. Analytics enhancements
16. Audit logs

### Phase 5: Polish (Weeks 9-10)
17. Accessibility audit & fixes
18. PWA implementation
19. i18n support
20. Dark mode completion

---

## 📝 Documentation Gaps

1. **API Documentation**: No docs for backend endpoints
2. **Component Storybook**: No visual component library
3. **Deployment Guide**: Exists but needs expansion
4. **Contributing Guide**: Missing
5. **Architecture Decision Records (ADRs)**: Not documented
6. **Onboarding Guide**: Missing for new developers

---

## 🔐 Security Improvements

1. **Content Security Policy**: Not implemented
2. **Rate Limiting**: Frontend has no protection
3. **Input Sanitization**: Not consistently applied
4. **XSS Protection**: Needs audit
5. **CSRF Protection**: Cookies use SameSite but needs verification
6. **API Key Rotation**: No mechanism
7. **Security Headers**: Need to verify in Vercel config

---

## 💡 Quick Wins (Can implement in < 1 day each)

1. Add loading spinner to all buttons on submit
2. Add "Last updated" timestamps to all list views
3. Add keyboard shortcuts (Cmd+K for search)
4. Add breadcrumbs to detail pages
5. Add "unsaved changes" warning on navigation
6. Add auto-save for long forms (CMS, settings)
7. Add "copy to clipboard" for IDs/codes
8. Add tooltips to icon buttons
9. Add empty states with illustrations
10. Add success animations (confetti on approval)

---

## 📈 Metrics to Track (Not Currently Tracked)

1. Page load time
2. API response time
3. Error rate
4. User session duration
5. Feature usage analytics
6. Conversion rates (seller applications → approvals)
7. Support ticket volume
8. Device uptime percentage

---

**Total Estimated Work**: ~10-12 weeks for one developer (full-time)
**Priority Focus**: Phases 1-2 to make production-ready (4 weeks)
