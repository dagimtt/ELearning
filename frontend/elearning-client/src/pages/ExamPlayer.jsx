import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { examsApi } from '../api/endpoints'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import Alert from '../components/Alert'

export default function ExamPlayer({ enrollmentId, lessonId, isCompleted, onProgressChange }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState('intro')   // 'intro' | 'taking' | 'review'
  const [answers, setAnswers] = useState({})  // questionId -> optionId
  const [submitError, setSubmitError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const examQuery = useQuery({
    queryKey: ['exam-learner', enrollmentId, lessonId],
    queryFn: () => examsApi.getForLearner(enrollmentId, lessonId),
  })

  const attemptsQuery = useQuery({
    queryKey: ['exam-attempts', enrollmentId, lessonId],
    queryFn: () => examsApi.attempts(enrollmentId, lessonId),
    enabled: examQuery.isSuccess,
  })

  const submitMutation = useMutation({
    mutationFn: (payload) => examsApi.submit(enrollmentId, lessonId, payload),
    onSuccess: (result) => {
      setLastResult(result)
      setMode('review')
      setSubmitError(null)
      queryClient.invalidateQueries({ queryKey: ['exam-learner', enrollmentId, lessonId] })
      queryClient.invalidateQueries({ queryKey: ['exam-attempts', enrollmentId, lessonId] })
      if (result.lessonMarkedComplete) {
        onProgressChange?.()
      }
    },
    onError: (err) => {
      setSubmitError(err.response?.data?.error || 'Could not submit exam.')
    },
  })

  // Reset answers when starting a new attempt
  const startExam = () => {
    setAnswers({})
    setSubmitError(null)
    setLastResult(null)
    setMode('taking')
  }

  if (examQuery.isLoading) return <LoadingSpinner label="Loading exam…" />
  if (examQuery.isError)
    return (
      <ErrorState
        message="Could not load this exam."
        onRetry={() => examQuery.refetch()}
      />
    )

  const exam = examQuery.data
  const attempts = attemptsQuery.data ?? []
  const attemptsUsed = attempts.length
  const attemptsLeft = exam.maxAttempts != null
    ? exam.maxAttempts - attemptsUsed
    : null

  const canAttempt = exam.maxAttempts == null || attemptsLeft > 0

  // -------------------- Intro --------------------
  if (mode === 'intro') {
    return (
      <div className="max-w-2xl">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-amber-900 mb-2">
            {exam.title}
          </h2>
          {exam.description && (
            <p className="text-sm text-amber-800 mb-4 whitespace-pre-line">
              {exam.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <Stat label="Questions" value={exam.questions.length} />
            <Stat label="Pass score" value={`${exam.passScore}%`} />
            <Stat
              label="Attempts"
              value={
                exam.maxAttempts == null
                  ? 'Unlimited'
                  : `${attemptsUsed}/${exam.maxAttempts}`
              }
            />
          </div>
        </div>

        {exam.alreadyPassed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="text-sm font-semibold text-green-800">
              ✓ You passed this exam
            </div>
            <p className="text-xs text-green-700 mt-1">
              Best score: {exam.bestScore ?? 100}%. You can retake if you'd like
              a higher score.
            </p>
          </div>
        )}

        {attempts.length > 0 && (
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Recent attempts
            </h3>
            <ul className="text-xs space-y-1">
              {attempts.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {new Date(a.submittedAt).toLocaleString()}
                  </span>
                  <span
                    className={`font-medium ${
                      a.passed ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {a.score}% {a.passed ? '· Passed' : '· Failed'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!canAttempt && (
          <Alert type="error">
            You have reached the maximum number of attempts for this exam.
          </Alert>
        )}

        {canAttempt && (
          <button
            onClick={startExam}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {attempts.length === 0 ? 'Start exam' : 'Retake exam'}
          </button>
        )}
      </div>
    )
  }

  // -------------------- Taking --------------------
  if (mode === 'taking') {
    const allAnswered = exam.questions.every((q) => answers[q.id])

    return (
      <div className="max-w-2xl">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 text-sm text-blue-900">
          Answer all {exam.questions.length} questions and submit. Pass score is{' '}
          <strong>{exam.passScore}%</strong>.
        </div>

        {submitError && <Alert type="error">{submitError}</Alert>}

        <ol className="space-y-6">
          {exam.questions.map((q, idx) => (
            <li key={q.id} className="bg-white border rounded-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="font-medium text-gray-900 pt-0.5">
                  {q.questionText}
                </p>
              </div>

              <div className="ml-10 space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 px-3 py-2 border rounded cursor-pointer transition ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt.id}
                        checked={selected}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-800">{opt.text}</span>
                    </label>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <button
            onClick={() => setMode('intro')}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Cancel
          </button>

          <button
            onClick={() =>
              submitMutation.mutate(
                exam.questions.map((q) => ({
                  questionId: q.id,
                  selectedOptionId: answers[q.id] ?? '',
                }))
              )
            }
            disabled={!allAnswered || submitMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit exam'}
          </button>
        </div>

        {!allAnswered && (
          <p className="text-xs text-gray-500 mt-2 text-right">
            Answer all questions to submit.
          </p>
        )}
      </div>
    )
  }

  // -------------------- Review --------------------
  const result = lastResult
  const passed = result.passed

  return (
    <div className="max-w-2xl">
      <div
        className={`rounded-lg p-6 mb-6 text-center ${
          passed
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
        <h2
          className={`text-2xl font-bold mb-2 ${
            passed ? 'text-green-900' : 'text-red-900'
          }`}
        >
          {passed ? 'You passed!' : 'Not quite'}
        </h2>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {result.score}%
        </div>
        <p className={`text-sm ${passed ? 'text-green-800' : 'text-red-800'}`}>
          Required: {result.passScoreRequired}%
        </p>
      </div>

      <div className="bg-white border rounded-lg p-5 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Question breakdown
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center py-2 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-700">
              {result.correctCount}
            </div>
            <div className="text-xs text-green-700">Correct</div>
          </div>
          <div className="text-center py-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-700">
              {result.totalCount - result.correctCount}
            </div>
            <div className="text-xs text-red-700">Wrong</div>
          </div>
        </div>

        <ol className="space-y-1 text-sm">
          {result.questionResults.map((qr, idx) => (
            <li
              key={qr.questionId}
              className="flex items-center gap-2 py-1"
            >
              <span
                className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  qr.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {qr.isCorrect ? '✓' : '✕'}
              </span>
              <span className="text-gray-700">
                Question {idx + 1}
                {!qr.isCorrect && (
                  <span className="text-gray-400 text-xs ml-2">
                    (correct answer not shown)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode('intro')}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to exam overview
        </button>

        {canAttempt && (
          <button
            onClick={startExam}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {passed ? 'Retake for a higher score' : 'Try again'}
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-amber-900">{value}</div>
      <div className="text-xs text-amber-700">{label}</div>
    </div>
  )
}