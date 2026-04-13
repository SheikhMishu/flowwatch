export default function WorkflowDetailLoading() {
  return (
    <>
      {/* Header bar shimmer */}
      <div className="h-14 border-b border-border bg-card/80 flex items-center px-4 md:px-6 shrink-0">
        <div className="h-4 w-40 rounded bg-muted animate-shimmer" />
      </div>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Back link shimmer */}
        <div className="h-4 w-28 rounded bg-muted animate-shimmer" />

        {/* Workflow header card shimmer */}
        <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-64 rounded bg-muted animate-shimmer" />
            <div className="h-5 w-16 rounded-full bg-muted animate-shimmer" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-5 w-14 rounded-full bg-muted animate-shimmer" />
            <div className="h-5 w-18 rounded-full bg-muted animate-shimmer" />
          </div>
          <div className="flex gap-4">
            <div className="h-3.5 w-36 rounded bg-muted animate-shimmer" />
            <div className="h-3.5 w-36 rounded bg-muted animate-shimmer" />
          </div>
        </div>

        {/* Stats row shimmer — 4 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card shadow-card p-5 space-y-2"
            >
              <div className="h-3 w-24 rounded bg-muted animate-shimmer" />
              <div className="h-7 w-20 rounded bg-muted animate-shimmer" />
              <div className="h-3 w-16 rounded bg-muted animate-shimmer" />
            </div>
          ))}
        </div>

        {/* Execution history table shimmer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-muted animate-shimmer" />
            <div className="h-3.5 w-24 rounded bg-muted animate-shimmer" />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {/* Table head */}
            <div className="border-b border-border bg-muted/40 px-4 py-3 flex gap-8">
              {["#ID", "Status", "Mode", "Started", "Duration", "Error"].map((col) => (
                <div key={col} className="h-3 w-14 rounded bg-muted animate-shimmer" />
              ))}
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-8">
                  <div className="h-3.5 w-12 rounded bg-muted animate-shimmer" />
                  <div className="h-5 w-20 rounded-full bg-muted animate-shimmer" />
                  <div className="h-3.5 w-16 rounded bg-muted animate-shimmer" />
                  <div className="h-3.5 w-24 rounded bg-muted animate-shimmer" />
                  <div className="h-3.5 w-14 rounded bg-muted animate-shimmer" />
                  <div className="h-3.5 w-32 rounded bg-muted animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
