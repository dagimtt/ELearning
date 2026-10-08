import { Link } from 'react-router-dom'

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="block bg-white rounded-lg border hover:shadow-md transition overflow-hidden"
    >
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-blue-400 text-4xl font-bold">
            {course.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="bg-gray-100 px-2 py-0.5 rounded">
            {course.categoryName}
          </span>
          <span>·</span>
          <span>{course.lessonCount} lessons</span>
        </div>
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {course.description}
        </p>
        <p className="text-xs text-gray-500">By {course.instructorName}</p>
      </div>
    </Link>
  )
}