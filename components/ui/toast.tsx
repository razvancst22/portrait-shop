'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, X } from 'lucide-react'

type ToastType = 'loading' | 'success' | 'error'

type Toast = {
  id: string
  type: ToastType
  message: string
  duration?: number
}

let toastCounter = 0
let listeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

export const showToast = {
  loading: (message: string) => addToast({ type: 'loading', message }),
  success: (message: string, duration = 3000) => addToast({ type: 'success', message, duration }),
  error: (message: string, duration = 5000) => addToast({ type: 'error', message, duration }),
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = `toast-${++toastCounter}`
  const newToast: Toast = { ...toast, id }
  toasts = [...toasts, newToast]
  listeners.forEach(listener => listener(toasts))

  if (toast.duration) {
    setTimeout(() => removeToast(id), toast.duration)
  }
  
  return id
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  listeners.forEach(listener => listener(toasts))
}

function ToastItem({ toast }: { toast: Toast }) {
  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-right-4 duration-300">
      {toast.type === 'loading' && (
        <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary shrink-0" />
      )}
      {toast.type === 'success' && (
        <CheckCircle className="size-4 text-green-500 shrink-0" />
      )}
      {toast.type === 'error' && (
        <X className="size-4 text-red-500 shrink-0" />
      )}
      <span className="text-sm text-foreground">{toast.message}</span>
      {toast.type !== 'loading' && (
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  if (currentToasts.length === 0) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {currentToasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  )
}