// src/hooks/useTokenRefresh.ts
/**
 * Hook to proactively refresh the access token on page load/refresh.
 * 
 * Problem: Access tokens are stored in memory (XSS protection).
 * On page refresh, memory is cleared, so the token is lost.
 * The refresh token is in an HttpOnly cookie and survives refreshes.
 * 
 * Solution: On mount, if there's no in-memory token, attempt a
 * silent refresh using the HttpOnly refresh cookie.
 */
import { useEffect, useRef } from "react"
import { getAccessToken, setAccessToken } from "@/lib/tokenManager"
import { useAuthStore } from "@/store/authStore"

export function useTokenRefresh() {
  const isRefreshing = useRef(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    // Only attempt refresh if Zustand says we're authenticated
    // (persisted from localStorage) but in-memory token is gone
    if (!isAuthenticated) return
    if (getAccessToken()) return // Token still in memory
    if (isRefreshing.current) return

    isRefreshing.current = true

    const refreshToken = async () => {
      try {
        console.log("[useTokenRefresh] No in-memory token, attempting silent refresh...")
        
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include", // Sends HttpOnly refresh cookie
        })

        if (response.ok) {
          const data = await response.json()
          setAccessToken(data.accessToken, data.expiresIn || 3600)
          
          // Update user data if returned
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              role: data.user.role,
              isActive: data.user.isActive,
            })
          }
          
          console.log("[useTokenRefresh] ✅ Silent refresh successful")
        } else {
          console.warn("[useTokenRefresh] ❌ Silent refresh failed:", response.status)
          // Only logout if it's a definitive auth failure (401)
          if (response.status === 401) {
            logout()
          }
        }
      } catch (error) {
        console.error("[useTokenRefresh] ❌ Silent refresh error:", error)
      } finally {
        isRefreshing.current = false
      }
    }

    refreshToken()
  }, [isAuthenticated, setUser, logout])
}
