export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-dark-600 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton({ cols = 3, rows = 2 }: { cols?: number; rows?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
      <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
      <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 mb-4">
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-dark-600 rounded flex-1"></div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 mb-3">
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} className="h-6 bg-gray-200 dark:bg-dark-600 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
}