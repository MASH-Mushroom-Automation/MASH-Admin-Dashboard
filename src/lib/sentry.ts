/**
 * Sentry Configuration for MASH Admin Dashboard
 * 
 * Setup Instructions:
 * 1. Install: npm install @sentry/nextjs
 * 2. Run: npx @sentry/wizard@latest -i nextjs
 * 3. Add SENTRY_DSN to .env.local
 * 4. Uncomment the initialization code below
 * 
 * For now, this is a placeholder that logs to console.
 * Once Sentry is set up, uncomment the real implementation.
 */

// import * as Sentry from '@sentry/nextjs'

interface SentryOptions {
  message: string
  level?: 'info' | 'warning' | 'error' | 'debug'
  extra?: Record<string, unknown>
}

class SentryClient {
  private isInitialized = false
  private isDevelopment = process.env.NODE_ENV === 'development'

  init() {
    if (this.isInitialized) return

    // TODO: Uncomment when Sentry is installed
    /*
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      enabled: !this.isDevelopment,
      
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Ignore common errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
      
      beforeSend(event) {
        // Don't send in development
        if (process.env.NODE_ENV === 'development') {
          return null
        }
        return event
      },
    })
    */

    if (this.isDevelopment) {
      console.log('[Sentry] Running in development mode - errors logged to console only')
    }

    this.isInitialized = true
  }

  captureMessage(options: SentryOptions) {
    if (this.isDevelopment) {
      console.log('[Sentry Mock] Message:', options)
      return
    }

    // TODO: Uncomment when Sentry is installed
    // Sentry.captureMessage(options.message, {
    //   level: options.level || 'info',
    //   extra: options.extra,
    // })
  }

  captureException(error: Error, extra?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.error('[Sentry Mock] Exception:', error, extra)
      return
    }

    // TODO: Uncomment when Sentry is installed
    // Sentry.captureException(error, { extra })
  }

  setUser(user: { id: string; email?: string; [key: string]: unknown } | null) {
    if (this.isDevelopment) {
      console.log('[Sentry Mock] Set user:', user)
      return
    }

    // TODO: Uncomment when Sentry is installed
    // Sentry.setUser(user)
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.log('[Sentry Mock] Breadcrumb:', { message, category, data })
      return
    }

    // TODO: Uncomment when Sentry is installed
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   level: 'info',
    // })
  }
}

// Export singleton
export const sentry = new SentryClient()

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  sentry.init()
}

// Export for type checking
export type { SentryOptions }
