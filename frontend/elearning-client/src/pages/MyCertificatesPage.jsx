import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { certificatesApi } from '../api/endpoints'
import { useToast } from '../toast/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

export default function MyCertificatesPage() {
  const toast = useToast()
  const query = useQuery({
    queryKey: ['my-certificates'],
    queryFn: certificatesApi.mine,
  })

  const handleDownload = async (cert) => {
    try {
      const blob = await certificatesApi.downloadPdf(cert.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${cert.code}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Could not download the certificate.')
    }
  }

  if (query.isLoading) return <LoadingSpinner label="Loading your certificates…" />
  if (query.isError)
    return (
      <ErrorState
        message="Could not load your certificates."
        onRetry={() => query.refetch()}
      />
    )

  if (query.data.length === 0) {
    return (
      <EmptyState
        title="No certificates yet"
        message="Complete a course and your instructor can issue you a certificate."
        action={
          <Link
            to="/my-courses"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View my courses
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600 mt-1">
          Download or share your course completions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {query.data.map((cert) => (
          <CertificateCard
            key={cert.id}
            cert={cert}
            onDownload={() => handleDownload(cert)}
          />
        ))}
      </div>
    </div>
  )
}

function CertificateCard({ cert, onDownload }) {
  const isRevoked = !!cert.revokedAt
  return (
    <div
      className={`bg-white rounded-lg border p-5 ${
        isRevoked ? 'border-red-200 bg-red-50/30' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {cert.title || 'Certificate of Completion'}
        </div>
        {isRevoked ? (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
            Revoked
          </span>
        ) : (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
            Active
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {cert.courseTitle}
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Issued by {cert.instructorName} ·{' '}
        {new Date(cert.issuedAt).toLocaleDateString()}
      </p>

      {cert.message && (
        <p className="text-sm text-gray-600 italic mb-3">"{cert.message}"</p>
      )}

      {isRevoked && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-3">
          <strong>Revoked:</strong> {cert.revokedReason}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-4">
        <span className="bg-gray-100 px-2 py-0.5 rounded">{cert.code}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDownload}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
        >
          Download PDF
        </button>
        <Link
          to={`/certificates/verify/${cert.code}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Verify page →
        </Link>
      </div>
    </div>
  )
}