/**
 * Sentry Configuration for MASH Admin Dashboard
 * 
 * ✅ Sentry is now fully configured!
 * 
 * Configuration files created by wizard:
 * - sentry.server.config.ts (server-side)
 * - sentry.edge.config.ts (edge runtime)
 * - src/instrumentation.ts (server instrumentation)
 * - src/instrumentation-client.ts (client instrumentation)
 * 
 * Test page: /sentry-example-page
 */

import * as Sentry from '@sentry/nextjs'

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

    // Sentry is now automatically initialized via instrumentation files
    // No manual init needed here
    if (this.isDevelopment) {
      console.log('[Sentry] Running in development mode - full Sentry integration active')
    }

    this.isInitialized = true
  }

  captureMessage(options: SentryOptions) {
    if (this.isDevelopment) {
      console.log('[Sentry] Message:', options)
    }

    Sentry.captureMessage(options.message, {
      level: options.level || 'info',
      extra: options.extra,
    })
  }

  captureException(error: Error, extra?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.error('[Sentry] Exception:', error, extra)
    }

    Sentry.captureException(error, { extra })
  }

  setUser(user: { id: string; email?: string; [key: string]: unknown } | null) {
    if (this.isDevelopment) {
      console.log('[Sentry] Set user:', user)
    }

    Sentry.setUser(user)
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.log('[Sentry] Breadcrumb:', { message, category, data })
    }

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    })
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
