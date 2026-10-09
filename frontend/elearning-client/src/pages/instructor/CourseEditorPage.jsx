import { useState } from 'react'
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
import CourseAnalyticsPanel from './CourseAnalyticsPanel'
import CourseCertificatesPanel from './CourseCertificatesPanel'
export default function CourseEditorPage() {
  const { id } = useParams()
  const [tab, setTab] = useState('content') // 'content' | 'analytics'

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

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-1">
  <TabButton active={tab === 'content'} onClick={() => setTab('content')}>
    Content
  </TabButton>
  <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')}>
    Analytics
  </TabButton>
  <TabButton active={tab === 'certificates'} onClick={() => setTab('certificates')}>
    Certificates
  </TabButton>
</div>

      {tab === 'content' && (
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
      )}

      {tab === 'analytics' && (
        <CourseAnalyticsPanel courseId={course.id} />
      )}

      {tab === 'certificates' && (
        <CourseCertificatesPanel courseId={course.id} />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        active
          ? 'border-blue-600 text-blue-700'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}