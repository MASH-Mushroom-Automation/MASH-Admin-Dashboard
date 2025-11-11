/**
 * Error Boundary Test Suite
 * Tests for error catching, fallback UI rendering, and recovery actions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'
import { logger } from '@/lib/logger'

// Mock logger
jest.mock('@/lib/logger')

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Success</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child component')).toBeInTheDocument()
  })

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should show error title
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    
    // Should show error message
    expect(screen.getByText(/test error/i)).toBeInTheDocument()
  })

  it('should log error to logger when caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(logger.error).toHaveBeenCalledWith(
      'Error caught by ErrorBoundary',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('should display "Try Again" button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    expect(tryAgainButton).toBeInTheDocument()
  })

  it('should reset error state when "Try Again" is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Error should be displayed
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    // Click Try Again
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(tryAgainButton)

    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    // Should show success state
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('should display "Go to Dashboard" link', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i })
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  it('should render custom fallback if provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })

  it('should handle multiple errors', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // First error
    expect(logger.error).toHaveBeenCalledTimes(1)

    // Reset and throw another error
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(tryAgainButton)

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Second error should also be logged
    expect(logger.error).toHaveBeenCalledTimes(2)
  })

  it('should display error details in development mode', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should show error message
    expect(screen.getByText(/test error/i)).toBeInTheDocument()
  })

  it('should catch errors from deeply nested components', () => {
    const DeeplyNested = () => (
      <div>
        <div>
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        </div>
      </div>
    )

    render(
      <ErrorBoundary>
        <DeeplyNested />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(logger.error).toHaveBeenCalled()
  })

  it('should handle errors in event handlers', () => {
    const ComponentWithEventError = () => {
      const handleClick = () => {
        throw new Error('Event handler error')
      }

      return <button onClick={handleClick}>Click me</button>
    }

    render(
      <ErrorBoundary>
        <ComponentWithEventError />
      </ErrorBoundary>
    )

    const button = screen.getByRole('button', { name: /click me/i })
    
    // Event handler errors are not caught by Error Boundaries
    // They need to be wrapped in try-catch
    expect(() => {
      fireEvent.click(button)
    }).toThrow('Event handler error')
  })

  it('should maintain error boundary state independently', () => {
    // Render two separate error boundaries
    render(
      <>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Working component</div>
        </ErrorBoundary>
      </>
    )

    // First boundary should show error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    
    // Second boundary should show normal content
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })
})
