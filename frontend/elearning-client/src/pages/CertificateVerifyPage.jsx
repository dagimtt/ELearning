import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { certificatesApi } from '../api/endpoints'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CertificateVerifyPage() {
  const { code } = useParams()
  const query = useQuery({
    queryKey: ['verify-certificate', code],
    queryFn: () => certificatesApi.verify(code),
    retry: false,
  })

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Certificate verification
        </h1>
        <p className="text-gray-600 mt-1">
          Verifying code: <span className="font-mono">{code}</span>
        </p>
      </div>

      {query.isLoading && <LoadingSpinner label="Verifying…" />}

      {query.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">✕</div>
          <h2 className="text-lg font-semibold text-red-900 mb-1">
            Certificate not found
          </h2>
          <p className="text-sm text-red-800">
            No certificate exists with that code. It may have been mistyped or
            never existed.
          </p>
        </div>
      )}

      {query.isSuccess && (
        <div
          className={`rounded-lg border p-8 text-center ${
            query.data.isValid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="text-5xl mb-4">
            {query.data.isValid ? '✓' : '⚠'}
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              query.data.isValid ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {query.data.isValid ? 'Valid certificate' : 'Revoked certificate'}
          </h2>
          <p
            className={`text-sm mb-6 ${
              query.data.isValid ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {query.data.isValid
              ? 'This certificate was issued by ELearning and is currently valid.'
              : 'This certificate has been revoked and is no longer considered valid.'}
          </p>

          <div className="bg-white rounded-lg border p-6 text-left max-w-md mx-auto">
            <Row label="Learner" value={query.data.learnerName} />
            <Row label="Course" value={query.data.courseTitle} />
            <Row label="Instructor" value={query.data.instructorName} />
            <Row
              label="Issued"
              value={new Date(query.data.issuedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
            <Row label="Title" value={query.data.title} />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="py-2 border-b last:border-b-0">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 mt-0.5">{value}</div>
    </div>
  )
}