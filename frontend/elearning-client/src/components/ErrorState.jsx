export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-800 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-red-700 underline hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}