using ELearning.Domain.Enums;

namespace ELearning.Application.DTOs.Courses;

// Summary for catalog cards
public record CourseSummaryDto(
    Guid Id,
    string Title,
    string Description,
    string? ThumbnailUrl,
    string CategoryName,
    string InstructorName,
    CourseStatus Status,
    int LessonCount);

// Full detail
public record CourseDetailDto(
    Guid Id,
    string Title,
    string Description,
    string? ThumbnailUrl,
    Guid CategoryId,
    string CategoryName,
    Guid InstructorId,
    string InstructorName,
    CourseStatus Status,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IEnumerable<LessonSummaryDto> Lessons);

public record LessonSummaryDto(
    Guid Id,
    string Title,
    int OrderIndex,
    LessonContentType ContentType);

// Create / update
public record CreateCourseRequest(
    string Title,
    string Description,
    string? ThumbnailUrl,
    Guid CategoryId);

public record UpdateCourseRequest(
    string Title,
    string Description,
    string? ThumbnailUrl,
    Guid CategoryId);