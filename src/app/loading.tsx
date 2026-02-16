export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 border-b bg-background/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded-md" />
        <div className="hidden md:flex gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-16 bg-muted rounded" />
          ))}
        </div>
        <div className="h-9 w-28 bg-muted rounded-md" />
      </div>

      {/* Hero skeleton */}
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 gap-6">
        <div className="h-5 w-40 bg-muted rounded-full" />
        <div className="space-y-3 text-center max-w-3xl">
          <div className="h-12 w-full bg-muted rounded-lg" />
          <div className="h-12 w-4/5 mx-auto bg-muted rounded-lg" />
          <div className="h-12 w-3/5 mx-auto bg-muted rounded-lg" />
        </div>
        <div className="h-5 w-96 bg-muted rounded mt-2" />
        <div className="flex gap-4 mt-2">
          <div className="h-12 w-44 bg-muted rounded-xl" />
          <div className="h-12 w-36 bg-muted rounded-xl" />
        </div>
        {/* Stats row */}
        <div className="flex gap-12 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-9 w-20 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Services skeleton */}
      <div className="py-20 px-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded mx-auto mb-4" />
        <div className="h-4 w-80 bg-muted rounded mx-auto mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="h-12 w-12 bg-muted rounded-xl" />
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Process skeleton */}
      <div className="py-20 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-56 bg-muted rounded mx-auto mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 bg-muted rounded-full" />
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
