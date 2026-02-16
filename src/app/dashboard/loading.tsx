export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 h-20" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6 space-y-3">
            <div className="h-5 w-36 bg-gray-200 dark:bg-white/10 rounded" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
