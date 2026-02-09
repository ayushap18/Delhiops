export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      role="status"
      aria-label="Loading"
    >
      {/* Dual-ring spinner */}
      <div className="relative h-12 w-12">
        {/* Outer ring */}
        <div
          className="absolute inset-0 border-2 border-brand/10 border-t-brand"
          style={{ animation: "spin-ring 1.2s linear infinite" }}
        />
        {/* Inner ring (reverse) */}
        <div
          className="absolute inset-2 border-2 border-brand/5 border-b-brand/60"
          style={{ animation: "spin-ring-reverse 0.8s linear infinite" }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-brand rounded-full status-dot" />
        </div>
      </div>
      <span className="mt-4 text-[9px] font-mono text-gray-500 tracking-[0.3em] typing-cursor">
        LOADING DATA
      </span>
      <div className="mt-2 w-24 h-px shimmer-line" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
