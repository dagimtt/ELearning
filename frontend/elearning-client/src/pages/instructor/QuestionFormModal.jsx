import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { examsApi } from '../../api/endpoints'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f']

export default function QuestionFormModal({ lessonId, question, onClose, onSaved }) {
  const isEdit = !!question

  const [questionText, setQuestionText] = useState(question?.questionText ?? '')
  const [points, setPoints] = useState(question?.points ?? 1)
  const [options, setOptions] = useState(
    question?.options?.length
      ? question.options
      : [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
        ]
  )
  const [correctOptionId, setCorrectOptionId] = useState(question?.correctOptionId ?? 'a')
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? examsApi.updateQuestion(question.id, payload)
        : examsApi.addQuestion(lessonId, payload),
    onSuccess: () => onSaved(),
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not save question.')
    },
  })

  const addOption = () => {
    if (options.length >= 6) return
    const nextId = OPTION_IDS[options.length]
    setOptions([...options, { id: nextId, text: '' }])
  }

  const removeOption = (index) => {
    if (options.length <= 2) return
    const removed = options[index]
    const next = options.filter((_, i) => i !== index)
    setOptions(next)
    if (correctOptionId === removed.id) {
      setCorrectOptionId(next[0].id)
    }
  }

  const updateOptionText = (index, text) => {
    const next = [...options]
    next[index] = { ...next[index], text }
    setOptions(next)
  }

  const handleSubmit = () => {
    setError(null)

    if (!questionText.trim()) {
      setError('Question text is required.')
      return
    }
    if (options.length < 2) {
      setError('At least 2 options are required.')
      return
    }
    if (options.some((o) => !o.text.trim())) {
      setError('All options must have text.')
      return
    }
    if (!options.find((o) => o.id === correctOptionId)) {
      setError('Select which option is correct.')
      return
    }

    mutation.mutate({
      questionText: questionText.trim(),
      options,
      correctOptionId,
      points: Number(points) || 1,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit question' : 'Add question'}
        </h3>

        {error && <Alert type="error">{error}</Alert>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question
          </label>
          <textarea
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="What does ASP.NET Core use for dependency injection?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Options
            </label>
            <span className="text-xs text-gray-500">
              Click the circle to mark the correct answer
            </span>
          </div>

          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectOptionId(opt.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    correctOptionId === opt.id
                      ? 'border-green-600 bg-green-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-label={`Mark option ${opt.id} as correct`}
                >
                  {correctOptionId === opt.id && (
                    <span className="w-3 h-3 rounded-full bg-green-600" />
                  )}
                </button>

                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                  placeholder={`Option ${opt.id.toUpperCase()}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-gray-400 hover:text-red-600 text-sm px-2"
                    aria-label={`Remove option ${opt.id.toUpperCase()}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              + Add another option
            </button>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Points (optional)
          </label>
          <input
            type="number"
            min="1"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            All questions currently count equally — this field is reserved for
            future weighted exams.
          </p>
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
            onClick={handleSubmit}
            className="w-auto px-6"
          >
            {isEdit ? 'Save changes' : 'Add question'}
          </Button>
        </div>
      </div>
    </div>
  )
}