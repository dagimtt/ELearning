import { useCallback, useState } from 'react'
import { ToastContext } from './ToastContext'

let nextId = 1

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type, message, duration = 3500) => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, type, message }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const toast = {
    success: (msg, dur) => push('success', msg, dur),
    error: (msg, dur) => push('error', msg, dur),
    info: (msg, dur) => push('info', msg, dur),
    dismiss,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-900 text-white',
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div
      className={`${styles[toast.type]} rounded-md shadow-lg px-4 py-3 flex items-start gap-3 animate-[slideIn_0.2s_ease-out]`}
      role="alert"
    >
      <span className="font-bold">{icons[toast.type]}</span>
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/70 hover:text-white text-sm"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}