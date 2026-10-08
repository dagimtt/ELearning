using ELearning.Domain.Enums;

namespace ELearning.Application.DTOs.Enrollments;

// For the "My Courses" list
public record EnrollmentSummaryDto(
    Guid Id,
    Guid CourseId,
    string CourseTitle,
    string? CourseThumbnailUrl,
    string CategoryName,
    string InstructorName,
    int TotalLessons,
    int CompletedLessons,
    int ProgressPercent,
    DateTime EnrolledAt);

// Course player payload: metadata only, no content
public record EnrollmentDetailDto(
    Guid Id,
    Guid CourseId,
    string CourseTitle,
    string CourseDescription,
    string? CourseThumbnailUrl,
    string CategoryName,
    string InstructorName,
    int TotalLessons,
    int CompletedLessons,
    int ProgressPercent,
    DateTime EnrolledAt,
    IEnumerable<EnrolledLessonDto> Lessons);

// Lesson metadata inside the course player
public record EnrolledLessonDto(
    Guid Id,
    string Title,
    int OrderIndex,
    LessonContentType ContentType,
    bool IsCompleted,
    DateTime? CompletedAt);

// Full content for one lesson (enrolled learner only)
public record LessonContentDto(
    Guid Id,
    Guid CourseId,
    string Title,
    int OrderIndex,
    LessonContentType ContentType,
    string? ContentText,
    string? VideoUrl,
    string? AttachmentUrl,
    bool IsCompleted,
    DateTime? CompletedAt);