import { useAuthStore } from '../authStore'
import { act, renderHook, waitFor } from '@testing-library/react'

// Mock fetch
global.fetch = jest.fn()

describe('authStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      error: null,
    })
    
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('setUser', () => {
    it('should set user and isAuthenticated to true', () => {
      const { result } = renderHook(() => useAuthStore())
      const testUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }

      act(() => {
        result.current.setUser(testUser)
      })

      expect(result.current.user).toEqual(testUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should set user to null and isAuthenticated to false', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setUser(null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear user state and call logout endpoint', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      // Set initial user
      act(() => {
        result.current.setUser({
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
      })

      // Logout
      act(() => {
        result.current.logout()
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('login', () => {
    it('should login successfully and set user state', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      } as Response)

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      )
    })

    it('should handle login failure', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Invalid credentials',
        }),
      } as Response)

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword')
        } catch {
          // Expected error
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle network errors', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password123')
        } catch {
          // Expected error
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('forgotPassword', () => {
    it('should handle forgot password request successfully', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await act(async () => {
        await result.current.forgotPassword('test@example.com')
      })

      expect(result.current.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      )
    })

    it('should handle forgot password request failure', async () => {
      const { result } = renderHook(() => useAuthStore())
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'User not found',
        }),
      } as Response)

      await act(async () => {
        try {
          await result.current.forgotPassword('notfound@example.com')
        } catch {
          // Expected error
        }
      })

      expect(result.current.error).toBe('User not found')
    })
  })
})
