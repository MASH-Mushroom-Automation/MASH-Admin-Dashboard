// Stub Sentry implementation
// TODO: Install @sentry/nextjs and configure properly

interface SentryUser {
  id: string
  email: string
}

export const sentry = {
  setUser: (user: SentryUser | null) => {
    // Placeholder for future Sentry integration
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] User set:', user)
    }
    // TODO: Sentry.setUser(user)
  },
  
  addBreadcrumb: (message: string, category: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Breadcrumb] ${category}: ${message}`)
    }
    // TODO: Sentry.addBreadcrumb({ message, category })
  }
}
