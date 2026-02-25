export function SkeletonCard() {
  return (
    <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-12 bg-gray-200 dark:bg-white/10 rounded" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="h-5 w-36 bg-gray-200 dark:bg-white/10 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
            <div className="h-5 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-white/10 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonList />
        <SkeletonList />
      </div>
    </div>
  );
}
