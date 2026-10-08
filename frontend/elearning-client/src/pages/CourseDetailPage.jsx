import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesApi, enrollmentsApi } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import Alert from '../components/Alert'

export default function CourseDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, hasRole } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const courseQuery = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.detail(id),
  })

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      navigate('/my-courses')
    },
  })

  if (courseQuery.isLoading) return <LoadingSpinner label="Loading course…" />
  if (courseQuery.isError)
    return (
      <ErrorState
        message="Course not found."
        onRetry={() => courseQuery.refetch()}
      />
    )

  const course = courseQuery.data
  const canEnroll = isAuthenticated && hasRole('Learner')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Link to="/courses" className="hover:underline">Catalog</Link>
            <span>/</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded">
              {course.categoryName}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {course.title}
          </h1>
          <p className="text-gray-700 whitespace-pre-line mb-4">
            {course.description}
          </p>
          <p className="text-sm text-gray-500">
            By <span className="font-medium">{course.instructorName}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Lessons ({course.lessons?.length ?? 0})
          </h2>

          {!course.lessons || course.lessons.length === 0 ? (
            <p className="text-gray-500 text-sm">No lessons yet.</p>
          ) : (
            <ol className="divide-y">
              {course.lessons.map((lesson, idx) => (
                <li key={lesson.id} className="py-3 flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">
                      {contentTypeLabel(lesson.contentType)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <aside className="lg:col-span-1">
        <div className="bg-white rounded-lg border p-6 sticky top-6">
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-50 rounded mb-4 flex items-center justify-center text-blue-400 text-5xl font-bold">
            {course.title.charAt(0).toUpperCase()}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <div className="flex justify-between py-1">
              <span>Lessons</span>
              <span className="font-medium">
                {course.lessons?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Category</span>
              <span className="font-medium">{course.categoryName}</span>
            </div>
          </div>

          {enrollMutation.isError && (
            <Alert type="error">
              {enrollMutation.error?.response?.data?.error ||
                'Could not enroll in this course.'}
            </Alert>
          )}

          {!isAuthenticated && (
            <Link
              to="/login"
              className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Sign in to enroll
            </Link>
          )}

          {isAuthenticated && !hasRole('Learner') && (
            <p className="text-sm text-gray-500 text-center">
              Only learners can enroll in courses.
            </p>
          )}

          {canEnroll && (
            <button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {enrollMutation.isPending ? 'Enrolling…' : 'Enroll'}
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

function contentTypeLabel(type) {
  return {
    0: 'Text',
    1: 'Video',
    2: 'Attachment',
  }[type] ?? 'Lesson'
}