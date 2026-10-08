import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="text-center py-24">
      <div className="text-7xl font-bold text-gray-300 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          Go home
        </Link>
        <Link
          to="/courses"
          className="bg-white border border-gray-300 text-gray-800 px-5 py-2 rounded hover:bg-gray-50"
        >
          Browse catalog
        </Link>
      </div>
    </div>
  )
}