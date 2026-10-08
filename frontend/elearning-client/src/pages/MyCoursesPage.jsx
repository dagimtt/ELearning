import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { enrollmentsApi } from '../api/endpoints'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import ProgressBar from '../components/ProgressBar'

export default function MyCoursesPage() {
  const query = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.mine,
  })

  if (query.isLoading) return <LoadingSpinner label="Loading your courses…" />
  if (query.isError)
    return (
      <ErrorState
        message="Could not load your courses."
        onRetry={() => query.refetch()}
      />
    )

  if (query.data.length === 0) {
    return (
      <EmptyState
        title="You haven't enrolled in any courses yet"
        message="Browse the catalog and find something to learn."
        action={
          <Link
            to="/courses"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse catalog
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {query.data.map((e) => (
          <div key={e.id} className="bg-white rounded-lg border p-4 flex gap-4">
            <div className="w-24 h-24 flex-shrink-0 rounded bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-400 text-3xl font-bold">
              {e.courseTitle.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">{e.categoryName}</div>
              <h3 className="font-semibold text-gray-900 truncate">
                {e.courseTitle}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                By {e.instructorName}
              </p>

              <div className="flex items-center gap-3 mb-3">
                <ProgressBar percent={e.progressPercent} size="sm" />
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {e.completedLessons}/{e.totalLessons}
                </span>
              </div>

              <Link
                to={`/learn/${e.id}`}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {e.progressPercent === 0
                  ? 'Start course →'
                  : e.progressPercent === 100
                  ? 'Review course →'
                  : 'Continue →'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}