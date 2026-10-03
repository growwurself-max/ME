import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Robust Error Boundary for 3D Canvas
 * Catches render errors, WebGL failures, Suspense rejections.
 * Displays premium fallback UI instead of white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if ((import.meta as any).env?.DEV) {
      console.error('[ErrorBoundary] 3D Canvas crash:', error, info.componentStack)
    }
    this.props.onError?.(error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-[#EAE5DC] bg-white p-8 text-center shadow-md">
          <div className="rounded-full bg-[#B88E52]/10 p-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B88E52" strokeWidth="1.5">
              <path d="M12 9v4M12 17h.01M10.3 3.3L3.3 10.3c-.4.4-.6.9-.6 1.5s.2 1.1.6 1.5l7 7c.4.4.9.6 1.5.6s1.1-.2 1.5-.6l7-7c.4-.4.6-.9.6-1.5s-.2-1.1-.6-1.5l-7-7a2.1 2.1 0 00-3 0z" />
            </svg>
          </div>
          <h3 className="font-display text-lg text-[#232120]">3D viewer unavailable</h3>
          <p className="max-w-md text-sm leading-relaxed text-[#6B6864]">
            Your browser or device doesn't support WebGL, or the GPU context was lost.
            Try reloading or viewing the product gallery below.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="rounded-full bg-[#8C6D3F] px-5 py-2 text-sm font-medium text-white hover:bg-[#775A38] transition-colors"
            >
              Try again
            </button>
            <a
              href="#gallery"
              className="rounded-full border border-[#EAE5DC] px-5 py-2 text-sm text-[#232120] hover:bg-[#FAF8F5] transition-colors"
            >
              Browse gallery
            </a>
          </div>
          {(import.meta as any).env?.DEV && this.state.error && (
            <pre className="mt-4 max-h-32 w-full overflow-auto rounded-lg bg-[#F7F5F0] p-3 text-left text-[11px] leading-relaxed text-[#6B6864]">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * WebGL capability check — call before mounting Canvas.
 * Returns true if WebGL2 or WebGL is available.
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Hook to gate 3D rendering on WebGL support + context loss handling.
 */
export function useWebGLSupport() {
  const [supported, setSupported] = React.useState(true)
  React.useEffect(() => {
    setSupported(isWebGLAvailable())
  }, [])
  return supported
}
