export default function SkeletonDocumentCard() {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-200/70 bg-white/80 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-28 bg-slate-100 rounded" />
        <div className="h-2 w-full bg-slate-200 rounded-full" />
      </div>

      <div className="space-y-2 pt-2">
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
      </div>

      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="h-3 w-20 bg-slate-100 rounded" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>

      <div className="h-9 w-full bg-slate-200 rounded-xl" />
    </div>
  );
}
