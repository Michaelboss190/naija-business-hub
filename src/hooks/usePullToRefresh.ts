import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(function() {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = function(e: TouchEvent) {
      if (container.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = function(e: TouchEvent) {
      if (container.scrollTop <= 0 && !isRefreshing) {
        const pullDistance = e.touches[0].clientY - touchStartY.current
        if (pullDistance > 60) {
          setIsRefreshing(true)
          onRefresh().finally(function() { setIsRefreshing(false) })
        }
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })

    return function() {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isRefreshing, onRefresh])

  return { containerRef, isRefreshing }
}