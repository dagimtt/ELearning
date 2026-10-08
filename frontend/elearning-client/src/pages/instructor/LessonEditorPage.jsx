import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lessonsApi, coursesApi } from '../../api/endpoints'
import FormField from '../../components/FormField'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'

const CONTENT_TYPES = {
  TEXT: 0,
  VIDEO: 1,
  ATTACHMENT: 2,
}

const schema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    contentType: z.coerce.number().int().min(0).max(2),
    contentText: z.string().max(50000).optional().or(z.literal('')),
    videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    attachmentUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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
  })

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams()
  const isEdit = !!lessonId
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Load the course (so we can show its title in the breadcrumb)
  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.detail(courseId),
  })

  // Load the lesson if editing
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
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (lessonQuery.data) {
      reset({
        title: lessonQuery.data.title,
        contentType: lessonQuery.data.contentType,
        contentText: lessonQuery.data.contentText ?? '',
        videoUrl: lessonQuery.data.videoUrl ?? '',
        attachmentUrl: lessonQuery.data.attachmentUrl ?? '',
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
      }
      return isEdit
        ? lessonsApi.update(lessonId, payload)
        : lessonsApi.create(courseId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      } else {
        navigate(`/instructor/courses/${courseId}`)
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
        {saveMutation.isSuccess && isEdit && (
          <Alert type="success">Lesson saved.</Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Title */}
          <FormField
            label="Lesson title"
            type="text"
            placeholder="e.g. Introduction"
            {...register('title')}
            error={errors.title?.message}
          />

          {/* Content type selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <TypeButton
                value={CONTENT_TYPES.TEXT}
                current={contentType}
                label="Text"
                icon="📝"
                register={register}
              />
              <TypeButton
                value={CONTENT_TYPES.VIDEO}
                current={contentType}
                label="Video"
                icon="🎬"
                register={register}
              />
              <TypeButton
                value={CONTENT_TYPES.ATTACHMENT}
                current={contentType}
                label="Attachment"
                icon="📎"
                register={register}
              />
            </div>
          </div>

          {/* Content-type-specific fields */}

          {contentType === CONTENT_TYPES.TEXT && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson content
                </label>
                <textarea
                  rows={10}
                  placeholder="Write the lesson content here. Markdown not yet supported — plain text for now."
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
            </>
          )}

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
                  placeholder="Add notes or a transcript to accompany the video."
                  {...register('contentText')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

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
                  placeholder="Describe what the learner will find in the file."
                  {...register('contentText')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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