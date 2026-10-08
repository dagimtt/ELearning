import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { coursesApi, categoriesApi } from '../../api/endpoints'
import FormField from '../../components/FormField'
import Button from '../../components/Button'
import Alert from '../../components/Alert'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(4000),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Pick a category'),
})

export default function CourseMetadataPanel({ course }) {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
    staleTime: 5 * 60_000,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? '',
      categoryId: course.categoryId,
    },
  })

  // Reset the form whenever the course changes (e.g., after publish)
  useEffect(() => {
    reset({
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? '',
      categoryId: course.categoryId,
    })
  }, [course, reset])

  const updateMutation = useMutation({
    mutationFn: (values) =>
      coursesApi.update(course.id, {
        title: values.title,
        description: values.description,
        thumbnailUrl: values.thumbnailUrl || null,
        categoryId: values.categoryId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      queryClient.invalidateQueries({ queryKey: ['course', course.id] })
      
    },
    onError: (err) => {
      setError('root', {
        message:
          err.response?.data?.error ||
          err.response?.data?.title ||
          'Could not save changes.',
      })
    },
  })

  const onSubmit = (values) => updateMutation.mutate(values)

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Course details</h2>

      {errors.root && <Alert type="error">{errors.root.message}</Alert>}
      {updateMutation.isSuccess && !isDirty && (
        <Alert type="success">Changes saved.</Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Title"
          type="text"
          {...register('title')}
          error={errors.title?.message}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={5}
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
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty}
            className="text-sm text-gray-600 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            Reset
          </button>
          <Button
            type="submit"
            loading={isSubmitting || updateMutation.isPending}
            disabled={!isDirty}
            className="w-auto px-6"
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}