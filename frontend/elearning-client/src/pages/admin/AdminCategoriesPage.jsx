import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { categoriesApi } from '../../api/endpoints'
import { useToast } from '../../toast/ToastContext'
import FormField from '../../components/FormField'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  description: z.string().max(500).optional().or(z.literal('')),
})

export default function AdminCategoriesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [actionError, setActionError] = useState(null)

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '' },
  })

  const createMutation = useMutation({
    mutationFn: (values) =>
      categoriesApi.create({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
      }),
    onSuccess: () => {
      toast.success('Category created')
      reset()
      setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => {
      setError('root', {
        message: err.response?.data?.error || 'Could not create category.',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.success('Category deleted')
      setPendingDelete(null)
      setActionError(null)
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => {
      setActionError(err.response?.data?.error || 'Could not delete category.')
      setPendingDelete(null)
    },
  })

  const autoSlug = (value) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Group courses into topics learners can browse.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
        >
          {showCreate ? 'Cancel' : '+ New category'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New category</h2>
          {errors.root && <Alert type="error">{errors.root.message}</Alert>}

          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} noValidate>
            <FormField
              label="Name"
              type="text"
              placeholder="e.g. Programming"
              {...register('name', {
                onChange: (e) => {
                  // Auto-suggest slug if user hasn't typed one
                },
              })}
              error={errors.name?.message}
            />
            <FormField
              label="Slug"
              type="text"
              placeholder="e.g. programming"
              {...register('slug')}
              error={errors.slug?.message}
            />
            <FormField
              label="Description (optional)"
              type="text"
              placeholder="A short description shown to learners"
              {...register('description')}
              error={errors.description?.message}
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  reset()
                  setShowCreate(false)
                }}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <Button
                type="submit"
                loading={isSubmitting || createMutation.isPending}
                className="w-auto px-6"
              >
                Create
              </Button>
            </div>
          </form>
        </div>
      )}

      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {actionError}
        </div>
      )}

      {query.isLoading && <LoadingSpinner label="Loading categories…" />}

      {query.isError && (
        <ErrorState
          message="Could not load categories."
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && query.data.length === 0 && (
        <EmptyState
          title="No categories yet"
          message="Create your first category to start grouping courses."
        />
      )}

      {query.isSuccess && query.data.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {query.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {c.slug}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.description || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setPendingDelete(c)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed. Courses cannot be deleted if they still belong to a category.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}