import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to ELearning
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Browse courses, learn at your own pace, or share what you know.
      </p>

      <div className="flex gap-3 justify-center">
        <Link
          to="/courses"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Browse courses
        </Link>

       {isAuthenticated && user?.roles?.includes('Instructor') && (
  <Link
    to="/instructor"
    className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-50"
  >
    Go to dashboard
  </Link>
)}

        {isAuthenticated && user.roles.includes('Instructor') && (
          <Link
            to="/instructor"
            className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-50"
          >
            Go to dashboard
          </Link>
        )}
      </div>
    </div>
  )
}