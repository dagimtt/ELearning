export default function Button({ children, loading, variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`w-full px-4 py-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${props.className ?? ''}`}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}