import client from './client'

// ---------- Auth ----------
export const authApi = {
  register: (payload) => client.post('/auth/register', payload).then(r => r.data),
  login: (payload) => client.post('/auth/login', payload).then(r => r.data),
}

// ---------- Categories ----------
export const categoriesApi = {
  list: () => client.get('/categories').then(r => r.data),
  create: (payload) => client.post('/categories', payload).then(r => r.data),
  remove: (id) => client.delete(`/categories/${id}`).then(r => r.data),
}

// ---------- Courses ----------
export const coursesApi = {
  catalog: (params) => client.get('/courses', { params }).then(r => r.data),
  detail: (id) => client.get(`/courses/${id}`).then(r => r.data),
  mine: () => client.get('/courses/mine').then(r => r.data),
  create: (payload) => client.post('/courses', payload).then(r => r.data),
  update: (id, payload) => client.put(`/courses/${id}`, payload).then(r => r.data),
  remove: (id) => client.delete(`/courses/${id}`).then(r => r.data),
  publish: (id) => client.post(`/courses/${id}/publish`).then(r => r.data),
  unpublish: (id) => client.post(`/courses/${id}/unpublish`).then(r => r.data),
}

// ---------- Lessons ----------
export const lessonsApi = {
  listPublic: (courseId) => client.get(`/courses/${courseId}/lessons`).then(r => r.data),
  getById: (id) => client.get(`/lessons/${id}`).then(r => r.data),
  create: (courseId, payload) => client.post(`/courses/${courseId}/lessons`, payload).then(r => r.data),
  update: (id, payload) => client.put(`/lessons/${id}`, payload).then(r => r.data),
  remove: (id) => client.delete(`/lessons/${id}`).then(r => r.data),
  reorder: (courseId, lessonIds) =>
    client.patch(`/courses/${courseId}/lessons/reorder`, { lessonIds }).then(r => r.data),
}

// ---------- Enrollments ----------
export const enrollmentsApi = {
  enroll: (courseId) => client.post(`/courses/${courseId}/enroll`).then(r => r.data),
  mine: () => client.get('/learner/enrollments').then(r => r.data),
  detail: (enrollmentId) => client.get(`/enrollments/${enrollmentId}`).then(r => r.data),
  lessonContent: (enrollmentId, lessonId) =>
    client.get(`/enrollments/${enrollmentId}/lessons/${lessonId}`).then(r => r.data),
  markComplete: (enrollmentId, lessonId) =>
    client.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`).then(r => r.data),
  unmarkComplete: (enrollmentId, lessonId) =>
    client.delete(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`).then(r => r.data),
}

// ---------- Admin ----------
export const adminApi = {
  users: (params) => client.get('/admin/users', { params }).then(r => r.data),
  changeRoles: (id, roles) => client.put(`/admin/users/${id}/roles`, { roles }).then(r => r.data),
  deleteUser: (id) => client.delete(`/admin/users/${id}`).then(r => r.data),
}
// ---------- Analytics ----------
export const analyticsApi = {
  course: (courseId) =>
    client.get(`/instructor/courses/${courseId}/analytics`).then(r => r.data),
  overview: () =>
    client.get('/instructor/analytics/overview').then(r => r.data),
}