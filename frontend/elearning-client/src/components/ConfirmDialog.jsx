import { useState } from 'react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  requireText,
  onConfirm,
  onCancel,
}) {
  const [input, setInput] = useState('')

  if (!open) return null

  const match = !requireText || input.trim() === requireText

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{message}</p>

        {requireText && (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Type <span className="font-mono font-medium">{requireText}</span> to confirm:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
          </>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:underline"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!match}
            className={`text-sm px-4 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}