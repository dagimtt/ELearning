import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/endpoints'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

const ALL_ROLES = ['Admin', 'Instructor', 'Learner']

export default function RolesModal({ user, onClose, onSaved }) {
  const [selected, setSelected] = useState(new Set(user.roles))
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: (roles) => adminApi.changeRoles(user.id, roles),
    onSuccess: () => onSaved(),
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not update roles.')
    },
  })

  const toggle = (role) => {
    const next = new Set(selected)
    if (next.has(role)) next.delete(role)
    else next.add(role)
    setSelected(next)
  }

  const handleSave = () => {
    if (selected.size === 0) {
      setError('At least one role is required.')
      return
    }
    setError(null)
    mutation.mutate(Array.from(selected))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Edit roles
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {user.fullName} · {user.email}
        </p>

        {error && <Alert type="error">{error}</Alert>}

        <div className="space-y-2 mb-6">
          {ALL_ROLES.map((role) => (
            <label
              key={role}
              className="flex items-center gap-3 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.has(role)}
                onChange={() => toggle(role)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-800">{role}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </button>
          <Button
            type="button"
            loading={mutation.isPending}
            onClick={handleSave}
            className="w-auto px-6"
          >
            Save roles
          </Button>
        </div>
      </div>
    </div>
  )
}