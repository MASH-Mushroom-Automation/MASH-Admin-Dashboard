// Global Error Handler for API calls
import { toast } from 'sonner'
import axios from 'axios'

export interface ErrorResponse {
  status: number
  message: string
  error?: string
}

/**
 * Handle API errors with user-friendly toast notifications
 * @param error - Error object from API call
 * @returns Structured error response
 */
export const handleApiError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500
    const message = error.response?.data?.message || 'An error occurred'
    const errorType = error.response?.data?.error
    
    switch (status) {
      case 400:
        toast.error(`Bad Request: ${message}`)
        break
        
      case 401:
        toast.error('Session expired. Please login again.')
        // Don't redirect here - let axios interceptor handle it
        break
        
      case 403:
        toast.error('You do not have permission to perform this action.')
        break
        
      case 404:
        toast.error('Resource not found.')
        break
        
      case 429:
        toast.error('Too many requests. Please slow down and try again later.')
        break
        
      case 500:
        toast.error('Server error. Please try again later.')
        break
        
      default:
        toast.error(message)
    }
    
    return { status, message, error: errorType }
  }
  
  // Non-axios errors (network issues, etc.)
  toast.error('An unexpected error occurred. Please check your connection.')
  return { status: 500, message: 'Unknown error' }
}

/**
 * Handle success responses with toast notifications
 * @param message - Success message to display
 */
export const handleApiSuccess = (message: string) => {
  toast.success(message)
}

/**
 * Handle validation errors (array of field errors)
 * @param errors - Array of validation error messages
 */
export const handleValidationErrors = (errors: string[]) => {
  errors.forEach(error => toast.error(error))
}
