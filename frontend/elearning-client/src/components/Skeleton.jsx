export function SkeletonLine({ className = '' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
}

export function SkeletonCourseCard() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="aspect-video bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <SkeletonLine className="h-3 w-1/3" />
        <SkeletonLine className="h-5 w-5/6" />
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function SkeletonCourseRow() {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
      <div className="w-16 h-16 rounded bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-1/4" />
        <SkeletonLine className="h-5 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonLessonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          <SkeletonLine className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}