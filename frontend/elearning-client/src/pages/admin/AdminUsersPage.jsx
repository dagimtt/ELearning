import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../toast/ToastContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'
import RolesModal from './RolesModal'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const { user: me } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)     // user being role-edited
  const [pendingDelete, setPendingDelete] = useState(null)
  const [actionError, setActionError] = useState(null)

  const query = useQuery({
    queryKey: ['admin-users', { page, search }],
    queryFn: () =>
      adminApi.users({ page, pageSize: PAGE_SIZE, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted')
      setPendingDelete(null)
      setActionError(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => {
      setActionError(err.response?.data?.error || 'Could not delete user.')
      setPendingDelete(null)
    },
  })

  const applySearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">
          Manage user accounts, roles, and access.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6">
        <input
          type="text"
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => applySearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {actionError}
        </div>
      )}

      {query.isLoading && <LoadingSpinner label="Loading users…" />}

      {query.isError && (
        <ErrorState
          message="Could not load users."
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && query.data.totalCount === 0 && (
        <EmptyState
          title="No users found"
          message={search ? 'Try a different search.' : 'Nothing to show.'}
        />
      )}

      {query.isSuccess && query.data.totalCount > 0 && (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {query.data.items.map((u) => {
                  const isMe = u.id === me.id
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {u.fullName}
                          {isMe && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditing(u)}
                          disabled={isMe}
                          className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                          Edit roles
                        </button>
                        <span className="mx-2 text-gray-300">·</span>
                        <button
                          onClick={() => setPendingDelete(u)}
                          disabled={isMe}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {query.data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {query.data.page} of {query.data.totalPages} · {query.data.totalCount} users
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= query.data.totalPages}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {editing && (
        <RolesModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            toast.success('Roles updated')
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
          }}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete user?"
        message={
          pendingDelete
            ? `"${pendingDelete.fullName}" will be permanently removed. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        requireText="DELETE"
        danger
        onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}