export function PageLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 shrink-0">
        <div className="flex-1">
          <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block h-8 w-28 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Page content skeleton */}
      <div className="flex-1 p-4 md:p-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card shadow-card p-5 space-y-3 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-2.5 w-20 rounded bg-muted" />
              <div className="h-7 w-14 rounded bg-muted" />
              <div className="h-2 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-56 rounded bg-muted" />
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-7 w-10 rounded-md bg-muted" />
              ))}
            </div>
          </div>
          <div className="h-[220px] rounded-lg bg-muted/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/30 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card shadow-card p-5 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-4 w-36 rounded bg-muted mb-4" />
              <div className="space-y-3">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded bg-muted" style={{ width: `${55 + j * 10}%` }} />
                      <div className="h-2 w-20 rounded bg-muted" />
                    </div>
                    <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
