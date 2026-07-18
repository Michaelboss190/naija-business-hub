// Simple performance monitoring utility
export function reportWebVitals() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime.toFixed(0) + 'ms')
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', entry.processingStart - entry.startTime + 'ms')
        }
      })
    })
    
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      observer.observe({ type: 'first-input', buffered: true })
    } catch (e) {
      // Observer not supported
    }
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let inThrottle = false
  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }) as T
}