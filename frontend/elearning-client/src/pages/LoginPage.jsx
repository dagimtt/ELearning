import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import Button from '../components/Button'
import Alert from '../components/Alert'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectFor(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const onSubmit = async (values) => {
    try {
      const loggedInUser = await login(values.email, values.password)
      const from = location.state?.from?.pathname
      navigate(from ?? redirectFor(loggedInUser), { replace: true })
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.title ||
        'Login failed. Check your credentials.'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in</h1>

        {errors.root && <Alert type="error">{errors.root.message}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" loading={isSubmitting}>Sign in</Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

function redirectFor(user) {
  if (!user) return '/'
  if (user.roles?.includes('Admin')) return '/admin/users'
  if (user.roles?.includes('Instructor')) return '/instructor'
  if (user.roles?.includes('Learner')) return '/my-courses'
  return '/'
}