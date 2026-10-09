import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function NavBar() {
  const { user, logout, hasRole, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-bold text-lg text-blue-700">ELearning</Link>

          <div className="ml-6 flex gap-1">
            <NavLink to="/courses" className={linkClass}>Catalog</NavLink>

           {hasRole('Learner') && (
  <>
    <NavLink to="/my-courses" className={linkClass}>
      My Courses
    </NavLink>
    <NavLink to="/my-certificates" className={linkClass}>
      Certificates
    </NavLink>
  </>
)}

            {hasRole('Instructor') && (
              <NavLink to="/instructor" className={linkClass}>Instructor</NavLink>
            )}

            {hasRole('Admin') && (
  <>
    <NavLink to="/admin/users" className={linkClass}>
      Users
    </NavLink>
    <NavLink to="/admin/categories" className={linkClass}>
      Categories
    </NavLink>
  </>
)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">
                {user.fullName}
                {user.roles?.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {user.roles[0]}
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:underline">
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}