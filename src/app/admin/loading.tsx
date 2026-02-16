export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-4 h-20" />
        ))}
      </div>
      {/* Filters bar */}
      <div className="flex gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      {/* Table rows */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-50 bg-white px-4 flex items-center gap-4">
            <div className="h-4 w-8 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
