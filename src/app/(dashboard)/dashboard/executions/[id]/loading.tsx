export default function ExecutionDetailLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 shrink-0">
        <div className="flex-1">
          <div className="h-4 w-40 rounded-md bg-muted animate-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block h-8 w-28 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 space-y-5">
        {/* Breadcrumb nav skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>

        {/* Execution header card skeleton */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3 flex-1">
              {/* ID + badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-7 w-20 rounded bg-muted" />
                <div className="h-6 w-20 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded-md bg-muted" />
              </div>
              {/* Workflow name */}
              <div className="h-4 w-56 rounded bg-muted" />
              {/* ID monospace */}
              <div className="h-3 w-40 rounded bg-muted" />
            </div>

            {/* Timing grid */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-6 gap-y-3 shrink-0">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-14 rounded bg-muted" />
                  <div className="h-4 w-36 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error card skeleton (conditionally shown — show as placeholder) */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-pulse space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-4 rounded bg-muted shrink-0" />
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
          <div className="h-20 rounded-lg bg-muted/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/30 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Node timeline card skeleton */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-pulse space-y-4">
          <div className="h-4 w-28 rounded bg-muted" />

          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
                  <div
                    className="h-3.5 rounded bg-muted flex-1"
                    style={{ width: `${40 + i * 10}%` }}
                  />
                  <div className="h-3 w-10 rounded bg-muted shrink-0" />
                </div>
                {/* Bar track */}
                <div className="ml-7 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/20 relative overflow-hidden"
                    style={{ width: `${25 + i * 15}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/20 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
