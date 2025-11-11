/**
 * Structured logging utility for MASH Admin Dashboard
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('API call failed', error, { endpoint: '/api/users' })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction && (level === 'debug' || level === 'info')) {
      return false
    }
    return true
  }

  private sendToMonitoring(level: LogLevel, message: string, error?: Error, context?: LogContext) {
    // TODO: Integrate with Sentry when available
    // This is where we'll send logs to external monitoring service
    if (this.isProduction && (level === 'error' || level === 'warn')) {
      // Placeholder for Sentry integration
      // Sentry.captureMessage(message, { level, extra: context })
      // if (error) Sentry.captureException(error)
      
      // Prevent unused variable warnings
      void message
      void error
      void context
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return

    console.debug(this.formatMessage('debug', message, context))
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return

    console.info(this.formatMessage('info', message, context))
    this.sendToMonitoring('info', message, undefined, context)
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return

    console.warn(this.formatMessage('warn', message, context))
    this.sendToMonitoring('warn', message, undefined, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!this.shouldLog('error')) return

    const errorObj = error instanceof Error ? error : new Error(String(error))
    
    console.error(this.formatMessage('error', message, context), errorObj)
    this.sendToMonitoring('error', message, errorObj, context)
  }

  // Helper for API errors
  apiError(endpoint: string, error: unknown, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error(`API Error: ${endpoint}`, error as Error, {
      endpoint,
      ...context,
      errorMessage,
    })
  }

  // Helper for auth errors
  authError(action: string, error: unknown, context?: LogContext) {
    this.error(`Auth Error: ${action}`, error as Error, {
      action,
      ...context,
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for testing
export { Logger }
