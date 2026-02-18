'use client'

import { useEffect, useState } from 'react'

interface ImageLoadEvent {
  url: string
  loadTime: number
  fileSize?: number
  timestamp: number
}

interface PerformanceStats {
  totalImages: number
  averageLoadTime: number
  totalDataTransferred: number
  fastestLoad: number
  slowestLoad: number
}

export function ImagePerformanceMonitor({ enabled = false }: { enabled?: boolean }) {
  const [stats, setStats] = useState<PerformanceStats>({
    totalImages: 0,
    averageLoadTime: 0,
    totalDataTransferred: 0,
    fastestLoad: Infinity,
    slowestLoad: 0
  })
  const [imageLoads, setImageLoads] = useState<ImageLoadEvent[]>([])

  useEffect(() => {
    if (!enabled) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource' && entry.name.includes('gallery')) {
          const loadEvent: ImageLoadEvent = {
            url: entry.name.split('/').pop() || 'unknown',
            loadTime: entry.duration,
            fileSize: (entry as any).transferSize,
            timestamp: Date.now()
          }
          
          setImageLoads(prev => {
            const updated = [...prev, loadEvent].slice(-10) // Keep last 10
            
            // Update stats
            const avgLoad = updated.reduce((sum, img) => sum + img.loadTime, 0) / updated.length
            const totalSize = updated.reduce((sum, img) => sum + (img.fileSize || 0), 0)
            const fastest = Math.min(...updated.map(img => img.loadTime))
            const slowest = Math.max(...updated.map(img => img.loadTime))
            
            setStats({
              totalImages: updated.length,
              averageLoadTime: avgLoad,
              totalDataTransferred: totalSize,
              fastestLoad: fastest === Infinity ? 0 : fastest,
              slowestLoad
            })
            
            return updated
          })
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
    
    return () => observer.disconnect()
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-sm">
      <div className="font-bold mb-2">🚀 Gallery Performance</div>
      <div className="space-y-1">
        <div>Images Loaded: {stats.totalImages}</div>
        <div>Avg Load Time: {stats.averageLoadTime.toFixed(0)}ms</div>
        <div>Data Used: {(stats.totalDataTransferred / 1024).toFixed(1)}KB</div>
        <div>Range: {stats.fastestLoad.toFixed(0)}ms - {stats.slowestLoad.toFixed(0)}ms</div>
      </div>
      
      {imageLoads.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="font-semibold mb-1">Recent Loads:</div>
          {imageLoads.slice(-3).map((load, i) => (
            <div key={i} className="text-xs opacity-80">
              {load.url}: {load.loadTime.toFixed(0)}ms
            </div>
          ))}
        </div>
      )}
    </div>
  )
}