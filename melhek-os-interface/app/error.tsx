'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error Boundary Caught:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4 text-center" 
         style={{ background: 'var(--melhek-bg-1)' }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,68,68,0.3)]"
           style={{ background: 'rgba(255,68,68,0.1)' }}>
        <AlertTriangle className="w-10 h-10" style={{ color: '#ff4444' }} />
      </div>
      
      <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--melhek-text-primary)' }}>
        System Anomaly Detected
      </h1>
      
      <p className="max-w-md text-sm leading-relaxed mb-8" style={{ color: 'var(--melhek-text-secondary)' }}>
        A critical error occurred while attempting to render this interface. 
        Our engineers have been notified. Please refresh the module to continue.
      </p>

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all press-scale text-black"
        style={{ background: 'linear-gradient(135deg, #0080FF, #00D4FF)' }}
      >
        <RefreshCw className="w-4 h-4" /> Initialize Recovery
      </button>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-10 p-4 rounded-xl text-left max-w-2xl w-full overflow-x-auto text-xs font-mono"
             style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff9999' }}>
          {error.message}
        </div>
      )}
    </div>
  )
}
