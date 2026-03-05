import { useState, useCallback, useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let _nextId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = ++_nextId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const isSuccess = toast.type === 'success'

  return (
    <div
      onClick={onDismiss}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl cursor-pointer min-w-[280px] max-w-[380px] mb-2 border transition-all duration-200 ${
        isSuccess
          ? 'bg-card border-profit/20'
          : 'bg-card border-destructive/20'
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(20px)',
      }}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-profit shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isSuccess ? 'text-profit' : 'text-destructive'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        <p className="text-sm text-foreground leading-snug">{toast.message}</p>
      </div>
      <X className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => onDismiss(toast.id)} />
        </div>
      ))}
    </div>
  )
}
