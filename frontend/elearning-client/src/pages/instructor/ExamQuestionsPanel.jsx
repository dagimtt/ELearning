import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { examsApi } from '../../api/endpoints'
import { useToast } from '../../toast/ToastContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import ConfirmDialog from '../../components/ConfirmDialog'
import Alert from '../../components/Alert'
import QuestionFormModal from './QuestionFormModal'

export default function ExamQuestionsPanel({ lessonId }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [editingQuestion, setEditingQuestion] = useState(null)   // question object or 'new'
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState(null)

  const query = useQuery({
    queryKey: ['exam-questions', lessonId],
    queryFn: () => examsApi.getForInstructor(lessonId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => examsApi.deleteQuestion(id),
    onSuccess: () => {
      toast.success('Question deleted')
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: ['exam-questions', lessonId] })
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not delete question.')
      setPendingDelete(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids) => examsApi.reorderQuestions(lessonId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-questions', lessonId] })
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not reorder.')
    },
  })

  if (query.isLoading) return <LoadingSpinner label="Loading questions…" />
  if (query.isError)
    return (
      <ErrorState
        message="Could not load questions."
        onRetry={() => query.refetch()}
      />
    )

  const { questions, passScore, maxAttempts } = query.data
  const list = [...questions].sort((a, b) => a.orderIndex - b.orderIndex)

  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const reordered = [...list]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    reorderMutation.mutate(reordered.map((q) => q.id))
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Exam questions ({list.length})</h2>
          <p className="text-xs text-gray-500 mt-1">
            Pass score: <strong>{passScore}%</strong>
            {maxAttempts ? ` · Max attempts: ${maxAttempts}` : ' · Unlimited attempts'}
          </p>
        </div>
        <button
          onClick={() => setEditingQuestion('new')}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
        >
          + Add question
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {list.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded border border-dashed">
          No questions yet. Add your first question to build the exam.
        </div>
      ) : (
        <ol className="divide-y">
          {list.map((q, idx) => (
            <li key={q.id} className="py-3 flex items-start gap-3">
              <div className="flex flex-col gap-0.5 pt-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || reorderMutation.isPending}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === list.length - 1 || reorderMutation.isPending}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center">
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{q.questionText}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {q.options.length} options ·{' '}
                  {q.points} point{q.points !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingQuestion(q)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDelete(q)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {editingQuestion && (
        <QuestionFormModal
          lessonId={lessonId}
          question={editingQuestion === 'new' ? null : editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => {
            setEditingQuestion(null)
            toast.success(editingQuestion === 'new' ? 'Question added' : 'Question saved')
            queryClient.invalidateQueries({ queryKey: ['exam-questions', lessonId] })
          }}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete question?"
        message={
          pendingDelete
            ? `"${pendingDelete.questionText.slice(0, 80)}…" will be permanently removed.`
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