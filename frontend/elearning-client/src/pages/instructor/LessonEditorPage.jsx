import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lessonsApi, coursesApi } from '../../api/endpoints'
import { useToast } from '../../toast/ToastContext'
import FormField from '../../components/FormField'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import ExamQuestionsPanel from './ExamQuestionsPanel'

const CONTENT_TYPES = {
  TEXT: 0,
  VIDEO: 1,
  ATTACHMENT: 2,
  EXAM: 3,
}

const schema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    contentType: z.coerce.number().int().min(0).max(3),
    contentText: z.string().max(50000).optional().or(z.literal('')),
    videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    attachmentUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    examPassScore: z.union([z.coerce.number().int().min(1).max(100), z.literal('')]).optional(),
    examMaxAttempts: z.union([z.coerce.number().int().min(1), z.literal('')]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.contentType === CONTENT_TYPES.TEXT && !data.contentText?.trim()) {
      ctx.addIssue({
        path: ['contentText'],
        code: 'custom',
        message: 'Text lessons need content.',
      })
    }
    if (data.contentType === CONTENT_TYPES.VIDEO && !data.videoUrl?.trim()) {
      ctx.addIssue({
        path: ['videoUrl'],
        code: 'custom',
        message: 'Video lessons need a video URL.',
      })
    }
    if (data.contentType === CONTENT_TYPES.ATTACHMENT && !data.attachmentUrl?.trim()) {
      ctx.addIssue({
        path: ['attachmentUrl'],
        code: 'custom',
        message: 'Attachment lessons need a file URL.',
      })
    }
    if (data.contentType === CONTENT_TYPES.EXAM) {
      if (data.examPassScore === '' || data.examPassScore == null) {
        ctx.addIssue({
          path: ['examPassScore'],
          code: 'custom',
          message: 'Pass score is required for exams.',
        })
      }
    }
  })

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams()
  const isEdit = !!lessonId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [createdLessonId, setCreatedLessonId] = useState(null)
  const effectiveLessonId = lessonId || createdLessonId

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.detail(courseId),
  })

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsApi.getById(lessonId),
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      contentType: CONTENT_TYPES.TEXT,
      contentText: '',
      videoUrl: '',
      attachmentUrl: '',
      examPassScore: 70,
      examMaxAttempts: '',
    },
  })

  useEffect(() => {
    if (lessonQuery.data) {
      reset({
        title: lessonQuery.data.title,
        contentType: lessonQuery.data.contentType,
        contentText: lessonQuery.data.contentText ?? '',
        videoUrl: lessonQuery.data.videoUrl ?? '',
        attachmentUrl: lessonQuery.data.attachmentUrl ?? '',
        examPassScore: lessonQuery.data.examPassScore ?? 70,
        examMaxAttempts: lessonQuery.data.examMaxAttempts ?? '',
      })
    }
  }, [lessonQuery.data, reset])

  const contentType = Number(watch('contentType'))

  const saveMutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        title: values.title,
        contentType: values.contentType,
        contentText: values.contentText || null,
        videoUrl: values.videoUrl || null,
        attachmentUrl: values.attachmentUrl || null,
        examPassScore: values.contentType === CONTENT_TYPES.EXAM
          ? Number(values.examPassScore)
          : null,
        examMaxAttempts: values.contentType === CONTENT_TYPES.EXAM && values.examMaxAttempts !== ''
          ? Number(values.examMaxAttempts)
          : null,
      }
      return isEdit
        ? lessonsApi.update(lessonId, payload)
        : lessonsApi.create(courseId, payload)
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })

      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
        toast.success('Lesson saved')
      } else {
        // Just created — switch to edit mode so questions can be added
        toast.success('Lesson created')
        navigate(`/instructor/courses/${courseId}/lessons/${saved.id}`, { replace: true })
      }
    },
    onError: (err) => {
      setError('root', {
        message:
          err.response?.data?.error ||
          err.response?.data?.title ||
          'Could not save lesson.',
      })
    },
  })

  const onSubmit = (values) => saveMutation.mutate(values)

  if (courseQuery.isLoading || (isEdit && lessonQuery.isLoading))
    return <LoadingSpinner label="Loading…" />

  if (courseQuery.isError)
    return (
      <ErrorState
        message="Could not load the course."
        onRetry={() => courseQuery.refetch()}
      />
    )

  if (isEdit && lessonQuery.isError)
    return (
      <ErrorState
        message="Could not load this lesson."
        onRetry={() => lessonQuery.refetch()}
      />
    )

  const course = courseQuery.data
  const lessonIsExam = isEdit && lessonQuery.data?.contentType === CONTENT_TYPES.EXAM

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          to={`/instructor/courses/${courseId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to {course.title}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          {isEdit ? 'Edit lesson' : 'Add a lesson'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit
            ? 'Update the lesson content.'
            : 'Choose a content type and fill in the details.'}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        {errors.root && <Alert type="error">{errors.root.message}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField
            label="Lesson title"
            type="text"
            placeholder="e.g. Introduction"
            {...register('title')}
            error={errors.title?.message}
          />

          {/* Content type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content type
            </label>
            <div className="grid grid-cols-4 gap-2">
              <TypeButton value={CONTENT_TYPES.TEXT} current={contentType} label="Text" icon="📝" register={register} />
              <TypeButton value={CONTENT_TYPES.VIDEO} current={contentType} label="Video" icon="🎬" register={register} />
              <TypeButton value={CONTENT_TYPES.ATTACHMENT} current={contentType} label="Attachment" icon="📎" register={register} />
              <TypeButton value={CONTENT_TYPES.EXAM} current={contentType} label="Exam" icon="📋" register={register} />
            </div>
          </div>

          {/* Text */}
          {contentType === CONTENT_TYPES.TEXT && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson content
              </label>
              <textarea
                rows={10}
                placeholder="Write the lesson content here."
                {...register('contentText')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors.contentText ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contentText && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contentText.message}
                </p>
              )}
            </div>
          )}

          {/* Video */}
          {contentType === CONTENT_TYPES.VIDEO && (
            <>
              <FormField
                label="Video URL"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register('videoUrl')}
                error={errors.videoUrl?.message}
              />
              <p className="text-xs text-gray-500 -mt-2 mb-4">
                YouTube watch URLs and direct video URLs both work.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={5}
                  {...register('contentText')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Attachment */}
          {contentType === CONTENT_TYPES.ATTACHMENT && (
            <>
              <FormField
                label="Attachment URL"
                type="url"
                placeholder="https://example.com/files/starter.zip"
                {...register('attachmentUrl')}
                error={errors.attachmentUrl?.message}
              />
              <p className="text-xs text-gray-500 -mt-2 mb-4">
                Paste a link to a PDF, slide deck, ZIP, or any downloadable file.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={5}
                  {...register('contentText')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Exam */}
          {contentType === CONTENT_TYPES.EXAM && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description / instructions (optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Answer all questions. You may retake the exam up to 3 times."
                  {...register('contentText')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pass score (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    {...register('examPassScore')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.examPassScore ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.examPassScore && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.examPassScore.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max attempts (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited"
                    {...register('examMaxAttempts')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.examMaxAttempts ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.examMaxAttempts && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.examMaxAttempts.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 mt-6">
            <Link
              to={`/instructor/courses/${courseId}`}
              className="text-sm text-gray-600 hover:underline"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              loading={isSubmitting || saveMutation.isPending}
              disabled={isEdit && !isDirty}
              className="w-auto px-6"
            >
              {isEdit ? 'Save changes' : 'Create lesson'}
            </Button>
          </div>
        </form>
      </div>

      {/* Question editor — only visible when editing an exam lesson */}
      {lessonIsExam && (
        <div className="mt-6">
          <ExamQuestionsPanel lessonId={lessonId} />
        </div>
      )}
    </div>
  )
}

function TypeButton({ value, current, label, icon, register }) {
  const isActive = Number(current) === value
  return (
    <label
      className={`cursor-pointer border rounded-md p-3 text-center transition ${
        isActive
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
          : 'border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        value={value}
        {...register('contentType')}
        className="sr-only"
      />
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-medium text-gray-800">{label}</div>
    </label>
  )
}

function contentTypeIsExam(lessonId) {
  // Placeholder — we rely on lessonIsExam inside the component instead.
  return false
}