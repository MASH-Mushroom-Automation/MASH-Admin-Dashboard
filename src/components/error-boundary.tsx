"use client"

import React from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error internally - no need for callback prop
    logger.error("Global error boundary caught error", {
      error,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="mx-auto max-w-md space-y-6 rounded-lg border border-destructive/50 bg-card p-8 text-center shadow-lg">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="w-full"
              >
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
