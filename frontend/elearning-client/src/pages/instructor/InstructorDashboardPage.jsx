import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { coursesApi } from '../../api/endpoints'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import StatusBadge from '../../components/StatusBadge'

export default function InstructorDashboardPage() {
  const query = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: coursesApi.mine,
  })

  if (query.isLoading) return <LoadingSpinner label="Loading your courses…" />
  if (query.isError)
    return (
      <ErrorState
        message="Could not load your courses."
        onRetry={() => query.refetch()}
      />
    )

  const courses = query.data ?? []
  const drafts = courses.filter((c) => c.status === 0).length
  const published = courses.filter((c) => c.status === 1).length

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
          {courses.map((course) => (
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
                <p className="text-sm text-gray-500 truncate">
                  {course.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/courses/${course.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:underline"
                >
                  Preview
                </Link>
                <Link
                  to={`/instructor/courses/${course.id}`}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}