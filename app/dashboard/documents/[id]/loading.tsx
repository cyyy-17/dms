export default function DocumentDetailLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-pulse">
      {/* Back button */}
      <div className="h-4 w-28 bg-slate-200 rounded" />

      {/* Header Banner & Stepper Skeleton */}
      <div className="rounded-3xl p-6 sm:p-7 bg-white/80 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="h-5 w-24 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-3/4 bg-slate-200 rounded" />
        <div className="h-16 bg-slate-50 rounded-2xl w-full border border-slate-100" />
      </div>

      {/* Two Column Content Skeleton */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-80 bg-white/80 rounded-3xl border border-slate-200/80 shadow-xs" />
          <div className="h-48 bg-white/80 rounded-3xl border border-slate-200/80 shadow-xs" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-96 bg-white/80 rounded-3xl border border-slate-200/80 shadow-xs" />
        </div>
      </div>
    </div>
  );
}