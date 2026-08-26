export default function DocumentsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-200 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-2xl" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-3xl p-5 bg-white/70 border border-slate-200/80 shadow-xs flex flex-wrap gap-3">
        <div className="h-10 flex-1 min-w-48 bg-slate-200 rounded-xl" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* Table Rows Skeleton */}
      <div className="rounded-3xl bg-white/80 border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
        <div className="h-8 bg-slate-100 rounded-xl w-full" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 bg-slate-50 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}
