'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDone: () => void
}

// Toast de confirmation flottant, auto-masqué après quelques secondes.
export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600)
    return () => clearTimeout(timer)
  }, [message, onDone])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '96px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: '9999px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        animation: 'toast-in 0.25s ease-out',
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: '#34c759' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {message}
      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  )
}
