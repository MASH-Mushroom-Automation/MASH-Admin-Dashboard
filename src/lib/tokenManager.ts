// Token Manager - In-Memory Token Storage (Security Best Practice)
// Access tokens stored in memory only (not localStorage) to prevent XSS attacks
// Refresh tokens stored in HttpOnly cookies (handled by API routes)

let accessToken: string | null = null
let tokenExpiry: number | null = null

/**
 * Set access token in memory with expiry tracking
 * @param token - JWT access token
 * @param expiresIn - Token validity in seconds (e.g., 3600 for 1 hour)
 */
export const setAccessToken = (token: string, expiresIn: number) => {
  accessToken = token
  tokenExpiry = Date.now() + (expiresIn * 1000)
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[TokenManager] Access token set, expires in:', expiresIn, 'seconds')
  }
}

/**
 * Get access token from memory if not expired
 * @returns Access token or null if expired/not set
 */
export const getAccessToken = (): string | null => {
  // Check if token expired
  if (tokenExpiry && Date.now() >= tokenExpiry) {
    if (process.env.NODE_ENV === 'development') {
      const minutesExpired = Math.floor((Date.now() - tokenExpiry) / (1000 * 60))
      console.log(`[TokenManager] ℹ️ Access token expired ${minutesExpired} minute(s) ago - will attempt refresh`)
    }
    accessToken = null
    tokenExpiry = null
    return null
  }
  return accessToken
}

/**
 * Clear access token from memory (e.g., on logout)
 */
export const clearAccessToken = () => {
  accessToken = null
  tokenExpiry = null
  if (process.env.NODE_ENV === 'development') {
    console.log('[TokenManager] Access token cleared')
  }
}

/**
 * Check if token should be refreshed (5 minutes before expiry)
 * @returns true if token should be refreshed
 */
export const shouldRefreshToken = (): boolean => {
  if (!tokenExpiry) return false
  // Refresh 5 minutes before expiry
  const shouldRefresh = Date.now() >= (tokenExpiry - 5 * 60 * 1000)
  
  if (shouldRefresh && process.env.NODE_ENV === 'development') {
    console.log('[TokenManager] Token should be refreshed')
  }
  
  return shouldRefresh
}

/**
 * Get time remaining until token expires (in seconds)
 * @returns Seconds until expiry, or 0 if expired/not set
 */
export const getTokenTimeRemaining = (): number => {
  if (!tokenExpiry) return 0
  const remaining = Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000))
  return remaining
}
