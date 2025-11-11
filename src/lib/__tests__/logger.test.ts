/**
 * Logger Test Suite
 * Tests for logging levels, formatting, and helper methods
 */

import { logger } from '../logger'

describe('logger', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('info', () => {
    it('should log info messages with correct format', () => {
      logger.info('Test info message')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Test info message')
      )
    })

    it('should log info with context object', () => {
      logger.info('User action', { userId: '123', action: 'login' })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('User action'),
        expect.objectContaining({ userId: '123', action: 'login' })
      )
    })

    it('should include timestamp in log', () => {
      logger.info('Timestamped message')

      const logCall = consoleLogSpy.mock.calls[0][0]
      // Check if timestamp format is present (ISO 8601)
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('warn', () => {
    it('should log warning messages with correct format', () => {
      logger.warn('Test warning')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Test warning')
      )
    })

    it('should log warnings with context', () => {
      logger.warn('Rate limit approaching', { limit: 100, current: 95 })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('Rate limit approaching'),
        expect.objectContaining({ limit: 100, current: 95 })
      )
    })
  })

  describe('error', () => {
    it('should log errors with correct format', () => {
      const testError = new Error('Test error')
      logger.error('Error occurred', testError)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Error occurred'),
        testError
      )
    })

    it('should log errors with additional context', () => {
      const testError = new Error('Database error')
      logger.error('Failed to save', testError, { table: 'users', operation: 'insert' })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Failed to save'),
        testError,
        expect.objectContaining({ table: 'users', operation: 'insert' })
      )
    })

    it('should handle errors without Error object', () => {
      logger.error('Something went wrong')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Something went wrong')
      )
    })
  })

  describe('debug', () => {
    it('should log debug messages in development', () => {
      logger.debug('Debug message')

      // Debug should call console.debug
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Debug message')
      )
    })

    it('should log debug with context', () => {
      logger.debug('State change', { before: 'idle', after: 'loading' })

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('State change'),
        expect.objectContaining({ before: 'idle', after: 'loading' })
      )
    })
  })

  describe('apiError', () => {
    it('should log API errors with endpoint', () => {
      const error = new Error('Network error')
      logger.apiError('/api/users', error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('API Error'),
        expect.stringContaining('/api/users'),
        error
      )
    })

    it('should include request context in API errors', () => {
      const error = new Error('Timeout')
      logger.apiError('/api/products', error, { page: 1, limit: 20 })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('API Error'),
        expect.stringContaining('/api/products'),
        error,
        expect.objectContaining({ page: 1, limit: 20 })
      )
    })
  })

  describe('authError', () => {
    it('should log authentication errors', () => {
      const error = new Error('Invalid credentials')
      logger.authError('login', error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Auth Error'),
        expect.stringContaining('login'),
        error
      )
    })

    it('should include user context in auth errors', () => {
      const error = new Error('Token expired')
      logger.authError('verify', error, { email: 'user@example.com' })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Auth Error'),
        expect.stringContaining('verify'),
        error,
        expect.objectContaining({ email: 'user@example.com' })
      )
    })
  })

  describe('Message formatting', () => {
    it('should handle empty context objects', () => {
      logger.info('Message', {})

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Message'),
        {}
      )
    })

    it('should handle null context', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger.info('Message', null as any)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Message'),
        null
      )
    })

    it('should handle nested objects in context', () => {
      const complexContext = {
        user: { id: '123', name: 'John' },
        metadata: { timestamp: Date.now(), source: 'web' }
      }

      logger.info('Complex log', complexContext)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Complex log'),
        expect.objectContaining({
          user: expect.objectContaining({ id: '123' }),
          metadata: expect.any(Object)
        })
      )
    })

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000)
      logger.info(longMessage)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('AAA')
      )
    })
  })

  describe('Multiple log calls', () => {
    it('should handle rapid consecutive logs', () => {
      logger.info('Message 1')
      logger.info('Message 2')
      logger.info('Message 3')

      expect(consoleLogSpy).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed log levels', () => {
      logger.debug('Debug')
      logger.info('Info')
      logger.warn('Warning')
      logger.error('Error', new Error('test'))

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error object handling', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at <anonymous>:1:1'
      
      logger.error('Failed', error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          message: 'Test error'
        })
      )
    })

    it('should handle custom error classes', () => {
      class CustomError extends Error {
        constructor(message: string, public code: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const error = new CustomError('Custom error', 'CUSTOM_001')
      logger.error('Custom error occurred', error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          message: 'Custom error',
          code: 'CUSTOM_001'
        })
      )
    })

    it('should handle string errors', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger.error('String error occurred', 'Something went wrong' as any)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
