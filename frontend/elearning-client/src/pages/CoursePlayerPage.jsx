import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enrollmentsApi } from '../api/endpoints'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import ProgressBar from '../components/ProgressBar'

export default function CoursePlayerPage() {
  const { enrollmentId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['enrollment', enrollmentId],
    queryFn: () => enrollmentsApi.detail(enrollmentId),
  })

  // Determine active lesson: from URL, or default to first lesson
  const lessons = detailQuery.data?.lessons ?? []
  const requestedLessonId = searchParams.get('lesson')
  const activeLesson =
    lessons.find((l) => l.id === requestedLessonId) ?? lessons[0]

  // Fetch content for active lesson
  const lessonQuery = useQuery({
    queryKey: ['lesson-content', enrollmentId, activeLesson?.id],
    queryFn: () => enrollmentsApi.lessonContent(enrollmentId, activeLesson.id),
    enabled: !!activeLesson?.id,
  })

  // Toggle completion
  const toggleMutation = useMutation({
    mutationFn: ({ lessonId, complete }) =>
      complete
        ? enrollmentsApi.unmarkComplete(enrollmentId, lessonId)
        : enrollmentsApi.markComplete(enrollmentId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] })
      queryClient.invalidateQueries({
        queryKey: ['lesson-content', enrollmentId, activeLesson?.id],
      })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] })
    },
  })

  if (detailQuery.isLoading) return <LoadingSpinner label="Loading course…" />
  if (detailQuery.isError)
    return (
      <ErrorState
        message="Could not open this course."
        onRetry={() => detailQuery.refetch()}
      />
    )

  const enrollment = detailQuery.data
  const isComplete = enrollment.progressPercent === 100

  const selectLesson = (lessonId) => {
    setSearchParams({ lesson: lessonId })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <Link to="/my-courses" className="text-xs text-blue-600 hover:underline">
            ← My Courses
          </Link>
          <h2 className="font-semibold text-gray-900 mt-2 leading-tight">
            {enrollment.courseTitle}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar percent={enrollment.progressPercent} size="sm" />
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {enrollment.completedLessons}/{enrollment.totalLessons}
            </span>
          </div>
        </div>

        {isComplete && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="text-sm font-semibold text-green-800 mb-1">
              🎉 Course complete!
            </div>
            <p className="text-xs text-green-700">
              Your instructor can now issue you a certificate.
            </p>
            <Link
              to="/my-certificates"
              className="text-xs text-green-800 font-medium hover:underline mt-1 inline-block"
            >
              Check My Certificates →
            </Link>
          </div>
        )}

        <ol className="max-h-[70vh] overflow-y-auto">
          {enrollment.lessons.map((lesson, idx) => {
            const isActive = lesson.id === activeLesson?.id
            return (
              <li key={lesson.id}>
                <button
                  onClick={() => selectLesson(lesson.id)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b hover:bg-gray-50 ${
                    isActive ? 'bg-blue-50' : ''
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                      lesson.isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {lesson.isCompleted ? '✓' : idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">
                    {lesson.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* Content pane */}
      <main className="bg-white rounded-lg border p-6 lg:p-8 min-h-[60vh]">
        {!activeLesson && (
          <p className="text-gray-500">This course has no lessons yet.</p>
        )}

        {activeLesson && (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeLesson.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Lesson {activeLesson.orderIndex + 1} of {enrollment.totalLessons}
                </p>
              </div>
            </div>

            {lessonQuery.isLoading && <LoadingSpinner label="Loading lesson…" />}

            {lessonQuery.isError && (
              <ErrorState
                message="Could not load this lesson."
                onRetry={() => lessonQuery.refetch()}
              />
            )}

            {lessonQuery.isSuccess && <LessonBody lesson={lessonQuery.data} />}

            <div className="mt-8 pt-6 border-t flex items-center justify-between">
              <CompletionButton
                lesson={activeLesson}
                pending={toggleMutation.isPending}
                onClick={() =>
                  toggleMutation.mutate({
                    lessonId: activeLesson.id,
                    complete: activeLesson.isCompleted,
                  })
                }
              />

              <NextLessonButton
                lessons={enrollment.lessons}
                current={activeLesson}
                onSelect={selectLesson}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function LessonBody({ lesson }) {
  if (lesson.contentType === 0) {
    return (
      <div className="prose max-w-none text-gray-800 whitespace-pre-line">
        {lesson.contentText}
      </div>
    )
  }

  if (lesson.contentType === 1) {
    return (
      <div>
        {lesson.videoUrl && (
          <div className="aspect-video bg-black rounded mb-4">
            <iframe
              src={toEmbedUrl(lesson.videoUrl)}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        {lesson.contentText && (
          <p className="text-gray-700 whitespace-pre-line">{lesson.contentText}</p>
        )}
      </div>
    )
  }

  if (lesson.contentType === 2) {
    return (
      <div>
        {lesson.contentText && (
          <p className="text-gray-700 whitespace-pre-line mb-4">
            {lesson.contentText}
          </p>
        )}
        {lesson.attachmentUrl && (
          <a
            href={lesson.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
          >
            Download attachment
          </a>
        )}
      </div>
    )
  }

  return <p className="text-gray-500">Unsupported lesson type.</p>
}

function CompletionButton({ lesson, pending, onClick }) {
  if (lesson.isCompleted) {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        className="text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
      >
        {pending ? 'Updating…' : '✓ Completed — click to undo'}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Mark as complete'}
    </button>
  )
}

function NextLessonButton({ lessons, current, onSelect }) {
  const idx = lessons.findIndex((l) => l.id === current.id)
  const next = lessons[idx + 1]
  if (!next) return null

  return (
    <button
      onClick={() => onSelect(next.id)}
      className="text-sm text-blue-600 font-medium hover:underline"
    >
      Next: {next.title} →
    </button>
  )
}

function toEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  return url
}