export default function DocumentDetailLoading() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-4 w-3 bg-slate-100 rounded" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-40 bg-slate-200 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
        <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
        <div className="h-5 w-1/2 bg-slate-100 rounded" />
      </div>
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="h-10 bg-slate-100 border-b border-slate-200" />
            <div className="h-96 bg-slate-50 flex items-center justify-center">
              <div className="space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-200 mx-auto" />
                <div className="h-4 w-32 bg-slate-200 rounded mx-auto" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-28 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-200 rounded-lg" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
            <div className="h-24 w-full bg-slate-50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}