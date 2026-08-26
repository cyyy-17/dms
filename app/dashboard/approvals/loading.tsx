export default function ApprovalsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-7 w-64 bg-slate-200 rounded-lg" />
            <div className="h-5 w-24 bg-slate-200 rounded-full" />
          </div>
          <div className="h-4 w-72 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-44 bg-slate-200 rounded-xl" />
      </div>

      {/* Cards Queue Skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl p-6 sm:p-7 bg-white/80 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-36 bg-slate-200 rounded" />
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-100 rounded" />
            </div>
            <div className="h-2 w-full max-w-lg bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
