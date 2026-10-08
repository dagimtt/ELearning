export default function EmptyState({ title, message, action }) {
  return (
    <div className="text-center py-16 bg-white rounded-lg border border-dashed">
      <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      {message && <p className="text-gray-500 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}