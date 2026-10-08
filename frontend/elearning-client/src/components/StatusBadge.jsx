export default function StatusBadge({ status }) {
  // CourseStatus: 0 = Draft, 1 = Published
  const isPublished = status === 1
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${
        isPublished
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  )
}