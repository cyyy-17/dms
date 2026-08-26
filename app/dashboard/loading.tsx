export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto w-full animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="rounded-3xl p-7 bg-white/70 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="h-5 w-24 bg-slate-200 rounded-full" />
        </div>
        <div className="h-4 w-96 max-w-full bg-slate-200 rounded" />
      </div>

      {/* Metrics Row Skeleton (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-3xl p-6 bg-white/70 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-200" />
              <div className="h-4 w-12 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-16 bg-slate-200 rounded" />
              <div className="h-3.5 w-28 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl p-6 bg-white/70 border border-slate-200/80 shadow-xs space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-3xl p-6 bg-white/70 border border-slate-200/80 shadow-xs space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
