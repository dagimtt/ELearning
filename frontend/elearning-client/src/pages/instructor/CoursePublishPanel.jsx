import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesApi } from '../../api/endpoints'
import ConfirmDialog from '../../components/ConfirmDialog'
import Alert from '../../components/Alert'

export default function CoursePublishPanel({ course }) {
  const queryClient = useQueryClient()
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [error, setError] = useState(null)

  const isPublished = course.status === 1

  const publishMutation = useMutation({
    mutationFn: () =>
      isPublished ? coursesApi.unpublish(course.id) : coursesApi.publish(course.id),
    onSuccess: () => {
      setConfirmPublish(false)
      queryClient.invalidateQueries({ queryKey: ['course', course.id] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (err) => {
      setError(
        err.response?.data?.error ||
          `Could not ${isPublished ? 'unpublish' : 'publish'} course.`
      )
    },
    
  })

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-2">Publishing</h2>

      {error && <Alert type="error">{error}</Alert>}

      {isPublished ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            This course is <span className="font-medium text-green-700">published</span> and visible
            in the catalog. Learners can enroll.
          </p>
          <button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded disabled:opacity-50"
          >
            {publishMutation.isPending ? 'Unpublishing…' : 'Unpublish'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            This course is a <span className="font-medium">draft</span> — only you can see it.
            Publish it to make it available in the catalog.
          </p>
          {(course.lessons?.length ?? 0) === 0 && (
            <Alert type="info">
              Tip: add at least one lesson before publishing.
            </Alert>
          )}
          <button
            onClick={() => setConfirmPublish(true)}
            disabled={publishMutation.isPending}
            className="w-full text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {publishMutation.isPending ? 'Publishing…' : 'Publish course'}
          </button>
        </>
      )}

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this course?"
        message="Once published, this course will appear in the public catalog and learners can enroll. You can unpublish it later."
        confirmLabel="Publish"
        onConfirm={() => publishMutation.mutate()}
        onCancel={() => setConfirmPublish(false)}
      />
    </div>
  )
}