import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lessonsApi } from '../../api/endpoints'
import ConfirmDialog from '../../components/ConfirmDialog'
import Alert from '../../components/Alert'

const contentTypeLabel = (t) =>
  ({ 0: 'Text', 1: 'Video', 2: 'Attachment', 3: 'Exam' }[t] ?? 'Lesson')
export default function CourseLessonsPanel({ course }) {
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState(null)

  const lessons = [...(course.lessons ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex
  )

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['course', course.id] })
    queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
  }

  const deleteMutation = useMutation({
    mutationFn: (lessonId) => lessonsApi.remove(lessonId),
    onSuccess: () => {
      setPendingDelete(null)
      invalidateAll()
      toast.success('Lesson deleted')
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not delete lesson.')
      setPendingDelete(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (lessonIds) => lessonsApi.reorder(course.id, lessonIds),
    onSuccess: () => invalidateAll(),
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not reorder lessons.')
      
    },
  })

  const move = (index, direction) => {
    const newLessons = [...lessons]
    const target = index + direction
    if (target < 0 || target >= newLessons.length) return
    ;[newLessons[index], newLessons[target]] = [newLessons[target], newLessons[index]]
    reorderMutation.mutate(newLessons.map((l) => l.id))
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Lessons ({lessons.length})
        </h2>
        <Link
          to={`/instructor/courses/${course.id}/lessons/new`}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
        >
          + Add lesson
        </Link>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {lessons.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center bg-gray-50 rounded border border-dashed">
          No lessons yet. Add your first lesson to get started.
        </p>
      ) : (
        <ol className="divide-y">
          {lessons.map((lesson, idx) => (
            <li key={lesson.id} className="py-3 flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || reorderMutation.isPending}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === lessons.length - 1 || reorderMutation.isPending}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center">
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {lesson.title}
                </p>
                <p className="text-xs text-gray-500">
                  {contentTypeLabel(lesson.contentType)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/instructor/courses/${course.id}/lessons/${lesson.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setPendingDelete(lesson)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete lesson?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently deleted. Learner progress on this lesson will also be removed.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}