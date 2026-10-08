import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { coursesApi, categoriesApi } from '../../api/endpoints'
import FormField from '../../components/FormField'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(4000),
  thumbnailUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().min(1, 'Pick a category'),
})

export default function CreateCoursePage() {
  const navigate = useNavigate()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      thumbnailUrl: '',
      categoryId: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (values) =>
      coursesApi.create({
        title: values.title,
        description: values.description,
        thumbnailUrl: values.thumbnailUrl || null,
        categoryId: values.categoryId,
      }),
    onSuccess: (course) => {
      navigate(`/instructor/courses/${course.id}`, { replace: true })
    },
    onError: (err) => {
      setError('root', {
        message:
          err.response?.data?.error ||
          err.response?.data?.title ||
          'Could not create course.',
      })
    },
  })

  const onSubmit = (values) => createMutation.mutate(values)

  if (categoriesQuery.isLoading)
    return <LoadingSpinner label="Loading categories…" />

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          to="/instructor"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Create a new course
        </h1>
        <p className="text-gray-600 mt-1">
          Start with the basics. You can add lessons and publish later.
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        {errors.root && <Alert type="error">{errors.root.message}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField
            label="Course title"
            type="text"
            placeholder="e.g. Introduction to ASP.NET Core"
            {...register('title')}
            error={errors.title?.message}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={5}
              placeholder="What will learners take away from this course?"
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <FormField
            label="Thumbnail URL (optional)"
            type="url"
            placeholder="https://example.com/image.jpg"
            {...register('thumbnailUrl')}
            error={errors.thumbnailUrl?.message}
          />

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              {...register('categoryId')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category…</option>
              {categoriesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/instructor"
              className="text-sm text-gray-600 hover:underline"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              loading={isSubmitting || createMutation.isPending}
              className="w-auto px-6"
            >
              Create course
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}