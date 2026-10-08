import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesApi } from '../../api/endpoints'
import ConfirmDialog from '../../components/ConfirmDialog'
import Alert from '../../components/Alert'

export default function CourseDangerPanel({ course }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: () => coursesApi.remove(course.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      navigate('/instructor', { replace: true })
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not delete course.')
      setConfirmOpen(false)
    },
  })

  return (
    <div className="bg-white rounded-lg border border-red-200 p-6">
      <h2 className="text-lg font-semibold text-red-700 mb-2">Danger zone</h2>

      {error && <Alert type="error">{error}</Alert>}

      <p className="text-sm text-gray-600 mb-4">
        Deleting a course permanently removes it along with all lessons,
        enrollments, and learner progress. This cannot be undone.
      </p>

      <button
        onClick={() => setConfirmOpen(true)}
        className="w-full text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Delete course
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this course?"
        message={`This will permanently delete "${course.title}" and all its lessons, enrollments, and learner progress.`}
        confirmLabel="Delete forever"
        requireText="DELETE"
        danger
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}