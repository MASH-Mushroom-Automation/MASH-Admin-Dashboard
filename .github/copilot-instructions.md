# MASH Admin Dashboard - AI Coding Guidelines

## Architecture Overview

**MASH Admin Dashboard** is a Next.js 15 application with App Router serving as an admin interface for mushroom automation systems. The app manages two main business domains:

- **MASH Market**: E-commerce functionality (users, sellers, orders, CMS)
- **MASH Grow**: Cultivation management (users, content management)

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: Zustand with persistence middleware
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (proxy to backend)
│   ├── dashboard/         # Main dashboard layout
│   ├── login/             # Authentication pages
│   ├── mash-market/       # E-commerce admin pages
│   └── mash-grow/         # Cultivation admin pages
├── components/
│   ├── ui/               # shadcn/ui components (do not modify)
│   ├── dashboard/        # Dashboard-specific components
│   ├── ecommerce/        # Market module components
│   └── mash-grow/        # Grow module components
├── store/                # Zustand stores
├── lib/                  # Utilities and configurations
└── hooks/                # Custom React hooks
```

## Key Patterns & Conventions

### Authentication & Security
- **Cookie-based auth**: Uses `authToken` and `refreshToken` cookies
- **Middleware protection**: `/middleware.ts` protects `/dashboard/*` routes
- **Dual login system**: Hardcoded admin credentials + backend API fallback
- **State persistence**: Auth state persisted in localStorage via Zustand

### Component Architecture
- **Feature-based organization**: Components grouped by business domain
- **Consistent layout pattern**: All admin pages use `Sidebar` + `Navbar` + content layout
- **shadcn/ui first**: Use existing UI components from `/components/ui/`
- **Client components**: Mark with `"use client"` directive when using hooks/state

### State Management
- **Zustand stores**: Use for global state (auth, user preferences)
- **Local component state**: Use `useState` for UI-specific state
- **Server state**: API calls handled directly in components (no React Query/SWR)

### API Integration
- **Proxy pattern**: `/api/*` routes proxy requests to backend to avoid CORS
- **Environment variables**: `NEXT_PUBLIC_API_URL` for backend endpoint
- **Error handling**: Consistent error responses with `success`, `message` structure

### Styling & Theming
- **Tailwind utility-first**: Use Tailwind classes over custom CSS
- **CSS variables**: Theme colors defined in `globals.css`
- **Component variants**: Use `class-variance-authority` for component variants
- **Responsive design**: Mobile-first approach with Tailwind breakpoints

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server (with Turbopack)
npm run dev:turbo    # Explicit Turbopack mode
npm run build        # Production build
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # ESLint checking
npm test            # Jest test runner
```

### Deployment
- **Platform**: Vercel (configured in `.github/workflows/deploy-vercel.yml`)
- **Build command**: `npm run build` (uses Turbopack)
- **Environment**: Production builds set `VERCEL=1`

## Common Implementation Patterns

### Adding New Admin Pages
1. Create page in appropriate module directory (`/mash-market/*` or `/mash-grow/*`)
2. Use the standard layout pattern:
```tsx
export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          {/* Page content */}
        </main>
      </div>
    </div>
  )
}
```

### API Route Creation
```typescript
// src/app/api/example/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    const response = await fetch(`${apiUrl}/api/v1/example`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
```

### Component Creation
- Place in appropriate feature directory (`/components/ecommerce/` or `/components/mash-grow/`)
- Use TypeScript interfaces for props and data structures
- Follow shadcn/ui patterns for consistency

### Form Handling
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })
  // Implementation...
}
```

## Critical Files to Reference

- **`/middleware.ts`**: Authentication logic and route protection
- **`/src/store/authStore.ts`**: Authentication state management
- **`/src/components/sidebar.tsx`**: Navigation structure and routing logic
- **`/components.json`**: shadcn/ui configuration and aliases
- **`/src/lib/utils.ts`**: Common utility functions (cn() for class merging)

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Set `NEXT_PUBLIC_API_URL` for backend API endpoint
3. For Vercel deployment, configure environment variables in Vercel dashboard

## Testing Strategy

- **Framework**: Jest with `ts-jest`
- **Coverage**: Minimal current coverage - focus on critical business logic
- **Mock data**: Use `MOCK_*` constants for development/demo data

## Deployment Notes

- **CI/CD**: GitHub Actions workflow builds and deploys to Vercel
- **Build optimization**: Uses Turbopack for faster builds
- **Environment detection**: Check `VERCEL` or `NODE_ENV` for production logic</content>
<parameter name="filePath">c:\Users\Kenneth\Desktop\PP Namias\MASH-Admin-Dashboard\.github\copilot-instructions.md