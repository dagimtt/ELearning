import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { certificatesApi, analyticsApi } from '../../api/endpoints'
import { useToast } from '../../toast/ToastContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import ProgressBar from '../../components/ProgressBar'
import ConfirmDialog from '../../components/ConfirmDialog'
import Alert from '../../components/Alert'

export default function CourseCertificatesPanel({ courseId }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [pendingRevoke, setPendingRevoke] = useState(null)
  const [issuingFor, setIssuingFor] = useState(null)     // learner object
  const [actionError, setActionError] = useState(null)

  // We reuse the analytics endpoint — it already returns per-learner completion
  const analyticsQuery = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: () => analyticsApi.course(courseId),
  })

  // Instructor's issued certificates for this course — we don't have a dedicated
  // endpoint yet, so we fetch the full cert list per learner via the analytics data
  // Approach: use a separate query per learner only when needed. For MVP, we fetch
  // the learner's certificates by reusing /learner/certificates? No — that endpoint
  // is scoped to the current user.
  //
  // Simplification: we cache issued certs client-side after issuing.
  // To display existing certs on load, we'd need a new endpoint. For MVP we
  // add a small backend endpoint: GET /api/courses/{courseId}/certificates
  //
  const certsQuery = useQuery({
    queryKey: ['course-certificates', courseId],
    queryFn: () => certificatesApi.listByCourse(courseId),
  })

  const issueMutation = useMutation({
    mutationFn: ({ learnerId, title, message }) =>
      certificatesApi.issue(courseId, learnerId, { title, message }),
    onSuccess: () => {
      toast.success('Certificate issued')
      setIssuingFor(null)
      setActionError(null)
      queryClient.invalidateQueries({ queryKey: ['course-certificates', courseId] })
    },
    onError: (err) => {
      setActionError(err.response?.data?.error || 'Could not issue certificate.')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }) => certificatesApi.revoke(id, reason),
    onSuccess: () => {
      toast.success('Certificate revoked')
      setPendingRevoke(null)
      setActionError(null)
      queryClient.invalidateQueries({ queryKey: ['course-certificates', courseId] })
    },
    onError: (err) => {
      setActionError(err.response?.data?.error || 'Could not revoke certificate.')
      setPendingRevoke(null)
    },
  })

  if (analyticsQuery.isLoading || certsQuery.isLoading)
    return <LoadingSpinner label="Loading learners…" />

  if (analyticsQuery.isError || certsQuery.isError)
    return (
      <ErrorState
        message="Could not load certificate data."
        onRetry={() => {
          analyticsQuery.refetch()
          certsQuery.refetch()
        }}
      />
    )

  const learners = analyticsQuery.data.learners
  const certificates = certsQuery.data ?? []

  const activeByLearnerId = new Map(
    certificates.filter((c) => c.isActive).map((c) => [c.learnerId, c])
  )

  return (
    <div className="space-y-4">
      {actionError && <Alert type="error">{actionError}</Alert>}

      <div className="bg-white rounded-lg border p-5">
        <div className="text-sm text-gray-600">
          Issue a certificate to learners who have completed all{' '}
          <span className="font-medium">{analyticsQuery.data.totalLessons}</span>{' '}
          lessons. Certificates can be revoked at any time.
        </div>
      </div>

      {learners.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-sm text-gray-500">
          No learners are enrolled in this course yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Certificate</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {learners.map((l) => {
                const isComplete = l.progressPercent === 100
                const activeCert = activeByLearnerId.get(l.learnerId)
                const isIssued = !!activeCert

                return (
                  <tr key={l.learnerId} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {l.learnerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {l.learnerEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <ProgressBar percent={l.progressPercent} size="sm" />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {l.completedLessons}/{l.totalLessons}
                        </span>
                        {isComplete && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Complete
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {isIssued ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {activeCert.code}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isIssued ? (
                        <button
                          onClick={() => setPendingRevoke(activeCert)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => setIssuingFor(l)}
                          disabled={!isComplete}
                          className="text-sm text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline"
                          title={
                            isComplete
                              ? 'Issue a certificate'
                              : 'Learner must complete all lessons first'
                          }
                        >
                          Issue certificate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {issuingFor && (
        <IssueModal
          learner={issuingFor}
          submitting={issueMutation.isPending}
          onSubmit={(payload) =>
            issueMutation.mutate({ learnerId: issuingFor.learnerId, ...payload })
          }
          onCancel={() => setIssuingFor(null)}
        />
      )}

      <RevokeDialog
        certificate={pendingRevoke}
        submitting={revokeMutation.isPending}
        onSubmit={(reason) => revokeMutation.mutate({ id: pendingRevoke.id, reason })}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  )
}

function IssueModal({ learner, submitting, onSubmit, onCancel }) {
  const [title, setTitle] = useState('Certificate of Completion')
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Issue certificate
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          To <span className="font-medium">{learner.learnerName}</span>
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message (optional)
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Congratulations on completing the course!"
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ title: title || null, message: message || null })}
            disabled={submitting}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Issuing…' : 'Issue certificate'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RevokeDialog({ certificate, submitting, onSubmit, onCancel }) {
  const [reason, setReason] = useState('')

  if (!certificate) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-red-700 mb-1">
          Revoke certificate
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Certificate <span className="font-mono">{certificate.code}</span> will
          be marked as revoked. It will remain visible to the learner but will
          no longer verify as valid.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason (required)
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Issued in error"
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason)}
            disabled={submitting || !reason.trim()}
            className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Revoking…' : 'Revoke certificate'}
          </button>
        </div>
      </div>
    </div>
  )
}