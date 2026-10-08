import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import Button from '../components/Button'
import Alert from '../components/Alert'

const schema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(150),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a digit'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    role: z.enum(['Learner', 'Instructor']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Learner' },
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectFor(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const onSubmit = async (values) => {
    try {
      const newUser = await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
      })
      navigate(redirectFor(newUser), { replace: true })
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.title ||
        'Registration failed.'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Create an account</h1>

        {errors.root && <Alert type="error">{errors.root.message}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField
            label="Full name"
            type="text"
            autoComplete="name"
            {...register('fullName')}
            error={errors.fullName?.message}
          />
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
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <FormField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I want to
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Learner" {...register('role')} />
                <span>Learn</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="Instructor" {...register('role')} />
                <span>Teach</span>
              </label>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting}>Create account</Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
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