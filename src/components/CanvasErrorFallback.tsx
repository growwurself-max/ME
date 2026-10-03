/**
 * Clean fallback for hero canvas when WebGL is lost or unsupported.
 * Used inside ErrorBoundary or as webglFailed state UI.
 */
export default function CanvasErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="fixed inset-0 z-0 flex flex-col items-center justify-center bg-[#FAF8F5] px-6 text-center">
      <div className="mb-4 h-10 w-10 rounded-full border border-[#B88E52]/20 flex items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-[#B88E52] animate-pulse" />
      </div>
      <h2 className="font-display text-xl text-[#232120]">Showroom is resting</h2>
      <p className="mt-2 max-w-sm text-sm text-[#6B6864]">
        3D is paused to save battery. Explore our collection below — full quality on desktop.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-full border border-[#B88E52]/30 bg-[#FAF8F5] px-6 py-2 text-sm text-[#8C6D3F] hover:bg-[#8C6D3F] hover:text-white transition-colors"
        >
          Reload 3D
        </button>
      )}
    </div>
  )
}
