import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { coursesApi, enrollmentsApi } from '../api/endpoints'
import ProgressBar from '../components/ProgressBar'
import { SkeletonCourseRow } from '../components/Skeleton'

export default function HomePage() {
  const { isAuthenticated, user, hasRole } = useAuth()

  if (!isAuthenticated) return <AnonymousHome />

  if (hasRole('Learner')) return <LearnerHome user={user} />
  if (hasRole('Instructor')) return <InstructorHome user={user} />

  // Admin
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome, {user.fullName}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        You're signed in as an administrator.
      </p>
      <Link
        to="/admin/users"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Manage users
      </Link>
    </div>
  )
}

function AnonymousHome() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to ELearning
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Browse courses, learn at your own pace, or share what you know by becoming an instructor.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/courses"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Browse courses
        </Link>
        <Link
          to="/register"
          className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-50"
        >
          Get started
        </Link>
      </div>
    </div>
  )
}

function LearnerHome({ user }) {
  const query = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.mine,
  })

  const inProgress = (query.data ?? []).filter(
    (e) => e.progressPercent > 0 && e.progressPercent < 100
  )
  const next = inProgress[0] ?? query.data?.[0]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          {query.isLoading
            ? 'Loading your courses…'
            : next
            ? `Pick up where you left off, or browse the catalog.`
            : 'Find a course to start learning.'}
        </p>
      </div>

      {query.isLoading && (
        <div className="space-y-3 mb-8">
          <SkeletonCourseRow />
          <SkeletonCourseRow />
        </div>
      )}

      {next && (
        <div className="bg-white rounded-lg border p-5 mb-8">
          <div className="text-xs text-gray-500 mb-1">Continue learning</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {next.courseTitle}
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            By {next.instructorName} · {next.categoryName}
          </p>
          <div className="flex items-center gap-3 mb-3">
            <ProgressBar percent={next.progressPercent} size="sm" />
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {next.completedLessons}/{next.totalLessons}
            </span>
          </div>
          <Link
            to={`/learn/${next.id}`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            {next.progressPercent === 0 ? 'Start' : 'Continue'} →
          </Link>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to="/my-courses"
          className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-50"
        >
          All my courses
        </Link>
        <Link
          to="/courses"
          className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-50"
        >
          Browse catalog
        </Link>
      </div>
    </div>
  )
}

function InstructorHome({ user }) {
  const query = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: coursesApi.mine,
  })

  const courses = query.data ?? []
  const drafts = courses.filter((c) => c.status === 0)
  const published = courses.filter((c) => c.status === 1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          {courses.length === 0
            ? 'You haven’t created a course yet.'
            : `You have ${published.length} published and ${drafts.length} draft${
                drafts.length !== 1 ? 's' : ''
              }.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard label="Published" value={published.length} tone="green" />
        <StatCard label="Drafts" value={drafts.length} tone="gray" />
      </div>

      <div className="flex gap-3">
        <Link
          to="/instructor/courses/new"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          + New course
        </Link>
        <Link
          to="/instructor"
          className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-50"
        >
          Instructor dashboard
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'gray' }) {
  const tones = {
    green: 'text-green-700 bg-green-50',
    gray: 'text-gray-700 bg-gray-50',
  }
  return (
    <div className="bg-white rounded-lg border p-5">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`inline-block text-3xl font-bold px-2 rounded ${tones[tone]}`}>
        {value}
      </div>
    </div>
  )
}