import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../../api/endpoints'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import ProgressBar from '../../components/ProgressBar'

export default function CourseAnalyticsPanel({ courseId }) {
  const query = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: () => analyticsApi.course(courseId),
  })

  if (query.isLoading) return <LoadingSpinner label="Loading analytics…" />
  if (query.isError)
    return (
      <ErrorState
        message="Could not load analytics."
        onRetry={() => query.refetch()}
      />
    )

  const a = query.data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Enrolled" value={a.totalEnrolled} tone="blue" />
        <StatTile label="Completed" value={a.completed} tone="green" />
        <StatTile label="In progress" value={a.inProgress} tone="amber" />
        <StatTile label="Not started" value={a.notStarted} tone="gray" />
      </div>

      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall completion rate</span>
          <span className="text-sm font-medium text-gray-900">
            {a.completionRate}%
          </span>
        </div>
        <ProgressBar percent={a.completionRate} />
        <p className="text-xs text-gray-500 mt-2">
          {a.completed} of {a.totalEnrolled} learners have finished all{' '}
          {a.totalLessons} lessons.
        </p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">
            Learners ({a.totalEnrolled})
          </h3>
        </div>

        {a.learners.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No one has enrolled in this course yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Enrolled</th>
                <th className="px-5 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {a.learners.map((l) => (
                <tr key={l.learnerId} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">
                      {l.learnerName}
                    </div>
                    <div className="text-xs text-gray-500">{l.learnerEmail}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <ProgressBar percent={l.progressPercent} size="sm" />
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {l.completedLessons}/{l.totalLessons}
                      </span>
                      {l.progressPercent === 100 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(l.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {l.lastCompletedAt
                      ? new Date(l.lastCompletedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, tone = 'gray' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    gray: 'bg-gray-100 text-gray-700',
  }
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`inline-block text-2xl font-bold px-2 rounded ${tones[tone]}`}>
        {value}
      </div>
    </div>
  )
}