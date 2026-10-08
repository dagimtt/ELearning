import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CatalogPage from './pages/CatalogPage'
import CourseDetailPage from './pages/CourseDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import RequireAuth from './routes/RequireAuth'
import RequireRole from './routes/RequireRole'

// Placeholders — filled in Milestones 4 & 5
const MyCourses = () => <div className="p-4"><h1 className="text-2xl font-bold">My Courses (soon)</h1></div>
const InstructorHome = () => <div className="p-4"><h1 className="text-2xl font-bold">Instructor Dashboard (soon)</h1></div>
const AdminUsers = () => <div className="p-4"><h1 className="text-2xl font-bold">Admin Users (soon)</h1></div>

export default function App() {
  return (
    <Routes>
      {/* Auth pages — no nav bar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything else wrapped in the layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CatalogPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* Authenticated routes */}
        <Route element={<RequireAuth><></></RequireAuth>}>
          <Route
            path="/my-courses"
            element={
              <RequireRole roles={['Learner']}>
                <MyCourses />
              </RequireRole>
            }
          />
          <Route
            path="/instructor"
            element={
              <RequireRole roles={['Instructor']}>
                <InstructorHome />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole roles={['Admin']}>
                <AdminUsers />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}