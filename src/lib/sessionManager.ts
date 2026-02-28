// Session Manager - User-friendly session expiration handling
import { toast } from "sonner";
import { clearAccessToken } from "./tokenManager";

let sessionExpiredHandled = false;

/**
 * Handle session expiration with user-friendly notification
 * This function is called when tokens are expired and refresh fails
 */
export const handleSessionExpiration = async () => {
  // Prevent multiple calls
  if (sessionExpiredHandled) {
    return;
  }
  
  sessionExpiredHandled = true;
  
  // Clear tokens
  clearAccessToken();
  
  // Show user-friendly notification
  toast.error("Session Expired", {
    description: "Your session has expired due to inactivity. Please log in again to continue.",
    duration: 5000,
  });
  
  // Clear user state from authStore
  if (typeof window !== "undefined") {
    const { useAuthStore } = await import("@/store/authStore");
    useAuthStore.getState().logout();
    
    // Redirect to login after a brief delay
    setTimeout(() => {
      window.location.href = "/login?expired=true";
      // Reset flag after redirect
      sessionExpiredHandled = false;
    }, 1000);
  }
};

/**
 * Handle authentication errors with appropriate user feedback
 * @param error - The error object from failed API call
 * @param context - Optional context for logging (e.g., "fetching user data")
 */
export const handleAuthError = async (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : "An error occurred";
  
  if (context && process.env.NODE_ENV === "development") {
    console.log(`[SessionManager] Auth error while ${context}:`, errorMessage);
  }
  
  // Check if it's a 401 (handled by interceptor) or other auth error
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { status?: number } }).response;
    
    if (response?.status === 401) {
      // Let the API interceptor handle this
      return;
    }
  }
  
  // For other errors, show a generic error message
  toast.error("Authentication Error", {
    description: "There was a problem with your request. Please try again.",
    duration: 4000,
  });
};

/**
 * Reset session expiration state (useful for testing or manual resets)
 */
export const resetSessionExpiredState = () => {
  sessionExpiredHandled = false;
};
