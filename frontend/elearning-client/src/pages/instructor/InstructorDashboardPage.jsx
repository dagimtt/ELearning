import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { coursesApi, analyticsApi } from '../../api/endpoints'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import StatusBadge from '../../components/StatusBadge'
import ProgressBar from '../../components/ProgressBar'

export default function InstructorDashboardPage() {
  const coursesQuery = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: coursesApi.mine,
  })

  const overviewQuery = useQuery({
    queryKey: ['instructor-analytics-overview'],
    queryFn: analyticsApi.overview,
  })

  if (coursesQuery.isLoading) return <LoadingSpinner label="Loading your courses…" />
  if (coursesQuery.isError)
    return (
      <ErrorState
        message="Could not load your courses."
        onRetry={() => coursesQuery.refetch()}
      />
    )

  const courses = coursesQuery.data ?? []
  const drafts = courses.filter((c) => c.status === 0).length
  const published = courses.filter((c) => c.status === 1).length
  const overview = overviewQuery.data

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor dashboard</h1>
          <p className="text-gray-600 mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} total
            {courses.length > 0 && (
              <>
                {' '}· {published} published · {drafts} draft
                {drafts !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
        <Link
          to="/instructor/courses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
        >
          + New course
        </Link>
      </div>

      {/* Overview stats */}
      {overview && overview.totalCourses > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatTile label="Total learners" value={overview.totalEnrollments} tone="blue" />
          <StatTile label="Completions" value={overview.totalCompletions} tone="green" />
          <StatTile label="Avg completion" value={`${overview.averageCompletionRate}%`} tone="amber" />
          <StatTile label="Published" value={overview.publishedCourses} tone="gray" />
        </div>
      )}

      {courses.length === 0 ? (
        <EmptyState
          title="You haven't created a course yet"
          message="Start with a title and description — you can add lessons and publish later."
          action={
            <Link
              to="/instructor/courses/new"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create your first course
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const summary = overview?.courses?.find((c) => c.courseId === course.id)
            return (
              <div
                key={course.id}
                className="bg-white rounded-lg border p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 flex-shrink-0 rounded bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-400 text-2xl font-bold">
                  {course.title.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={course.status} />
                    <span className="text-xs text-gray-500">
                      {course.categoryName}
                    </span>
                    <span className="text-xs text-gray-500">·</span>
                    <span className="text-xs text-gray-500">
                      {course.lessonCount} lesson{course.lessonCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {course.title}
                  </h3>
                  {summary && summary.totalEnrolled > 0 ? (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-32">
                        <ProgressBar percent={summary.completionRate} size="sm" />
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {summary.completed}/{summary.totalEnrolled} completed
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 truncate">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/instructor/courses/${course.id}`}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-medium"
                  >
                    Open
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
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