export default function ProgressBar({ percent, size = 'md' }) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2'
  const tone =
    percent === 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-blue-400'
  return (
    <div className={`w-full ${height} bg-gray-200 rounded overflow-hidden`}>
      <div
        className={`${height} ${tone} transition-all`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}