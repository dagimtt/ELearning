import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CatalogPage from './pages/CatalogPage'
import CourseDetailPage from './pages/CourseDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import MyCoursesPage from './pages/MyCoursesPage'
import CoursePlayerPage from './pages/CoursePlayerPage'
import RequireAuth from './routes/RequireAuth'
import RequireRole from './routes/RequireRole'
import InstructorDashboardPage from './pages/instructor/InstructorDashboardPage'
import CreateCoursePage from './pages/instructor/CreateCoursePage'
import CourseEditorPage from './pages/instructor/CourseEditorPage'
import LessonEditorPage from './pages/instructor/LessonEditorPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import MyCertificatesPage from './pages/MyCertificatesPage'
import CertificateVerifyPage from './pages/CertificateVerifyPage'
// Placeholder — filled in Milestone 6
const AdminUsers = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Admin Users (soon)</h1>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Auth pages — no nav bar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything else wrapped in the layout */}
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CatalogPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* Learner */}
        <Route
          path="/my-courses"
          element={
            <RequireAuth>
              <RequireRole roles={['Learner']}>
                <MyCoursesPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/learn/:enrollmentId"
          element={
            <RequireAuth>
              <RequireRole roles={['Learner']}>
                <CoursePlayerPage />
              </RequireRole>
            </RequireAuth>
          }
        />
     <Route
  path="/admin/users"
  element={
    <RequireAuth>
      <RequireRole roles={['Admin']}>
        <AdminUsersPage />
      </RequireRole>
    </RequireAuth>
  }
/>
<Route
  path="/admin/categories"
  element={
    <RequireAuth>
      <RequireRole roles={['Admin']}>
        <AdminCategoriesPage />
      </RequireRole>
    </RequireAuth>
  }
/>
        {/* Instructor — order matters: /new before /:id */}
        <Route
          path="/instructor"
          element={
            <RequireAuth>
              <RequireRole roles={['Instructor']}>
                <InstructorDashboardPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/courses/new"
          element={
            <RequireAuth>
              <RequireRole roles={['Instructor']}>
                <CreateCoursePage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/courses/:id"
          element={
            <RequireAuth>
              <RequireRole roles={['Instructor']}>
                <CourseEditorPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/courses/:courseId/lessons/new"
          element={
            <RequireAuth>
              <RequireRole roles={['Instructor']}>
                <LessonEditorPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/instructor/courses/:courseId/lessons/:lessonId"
          element={
            <RequireAuth>
              <RequireRole roles={['Instructor']}>
                <LessonEditorPage />
              </RequireRole>
            </RequireAuth>
          }
        />
{/* Learner certificates */}
<Route
  path="/my-certificates"
  element={
    <RequireAuth>
      <RequireRole roles={['Learner']}>
        <MyCertificatesPage />
      </RequireRole>
    </RequireAuth>
  }
/>

{/* Public verification — no auth */}
<Route
  path="/certificates/verify/:code"
  element={<CertificateVerifyPage />}
/>
        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireRole roles={['Admin']}>
                <AdminUsers />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}