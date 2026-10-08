import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { coursesApi } from '../../api/endpoints'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import StatusBadge from '../../components/StatusBadge'
import CourseMetadataPanel from './CourseMetadataPanel'
import CourseLessonsPanel from './CourseLessonsPanel'
import CoursePublishPanel from './CoursePublishPanel'
import CourseDangerPanel from './CourseDangerPanel'

export default function CourseEditorPage() {
  const { id } = useParams()

  const query = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.detail(id),
  })

  if (query.isLoading) return <LoadingSpinner label="Loading course…" />
  if (query.isError)
    return (
      <ErrorState
        message="Could not load this course. It may not exist or you may not own it."
        onRetry={() => query.refetch()}
      />
    )

  const course = query.data

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link to="/instructor" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-3xl font-bold text-gray-900 truncate">
            {course.title}
          </h1>
          <StatusBadge status={course.status} />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {course.categoryName} · {course.lessons?.length ?? 0} lesson
          {(course.lessons?.length ?? 0) !== 1 ? 's' : ''}
          {course.status === 1 && (
            <>
              {' '}· <Link
                to={`/courses/${course.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Preview public page
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CourseMetadataPanel course={course} />
          <CourseLessonsPanel course={course} />
        </div>

        <aside className="space-y-6">
          <CoursePublishPanel course={course} />
          <CourseDangerPanel course={course} />
        </aside>
      </div>
    </div>
  )
}