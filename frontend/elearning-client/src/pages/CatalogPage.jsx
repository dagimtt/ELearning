import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { categoriesApi, coursesApi } from '../api/endpoints'
import CourseCard from '../components/CourseCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'

const PAGE_SIZE = 12

export default function CatalogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // Categories are stable — cache forever-ish
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
    staleTime: 5 * 60_000,
  })

  // Courses — refetch when filters change
  const coursesQuery = useQuery({
    queryKey: ['courses', { page, search, categoryId }],
    queryFn: () =>
      coursesApi.catalog({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        categoryId: categoryId || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  // Reset to page 1 when filters change
  const applyFilter = (fn) => {
    fn()
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Course catalog</h1>
        <p className="text-gray-600">Browse published courses from our instructors.</p>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => applyFilter(() => setSearch(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryId}
          onChange={(e) => applyFilter(() => setCategoryId(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {coursesQuery.isLoading && <LoadingSpinner label="Loading courses…" />}

      {coursesQuery.isError && (
        <ErrorState
          message="Could not load courses."
          onRetry={() => coursesQuery.refetch()}
        />
      )}

      {coursesQuery.isSuccess && coursesQuery.data.totalCount === 0 && (
        <EmptyState
          title="No courses found"
          message={
            search || categoryId
              ? 'Try clearing your filters.'
              : 'No courses have been published yet. Check back soon!'
          }
        />
      )}

      {coursesQuery.isSuccess && coursesQuery.data.totalCount > 0 && (
        <>
          <div className="mb-3 text-sm text-gray-600">
            {coursesQuery.data.totalCount} course
            {coursesQuery.data.totalCount !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coursesQuery.data.items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {coursesQuery.data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {coursesQuery.data.page} of {coursesQuery.data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= coursesQuery.data.totalPages}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}