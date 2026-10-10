using ELearning.Domain.Enums;

namespace ELearning.Application.DTOs.Lessons;

// Full detail for authenticated owners / enrolled learners
public record LessonDto(
    Guid Id,
    Guid CourseId,
    string Title,
    LessonContentType ContentType,
    string? ContentText,
    string? VideoUrl,
    string? AttachmentUrl,
    int OrderIndex,
    int? ExamPassScore,
    int? ExamMaxAttempts,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

// Public summary inside CourseDetailDto already exists as LessonSummaryDto.
// Public full-lesson for published courses (content shown in course player):
public record PublicLessonDto(
    Guid Id,
    string Title,
    LessonContentType ContentType,
    string? ContentText,
    string? VideoUrl,
    string? AttachmentUrl,
    int OrderIndex);

public record CreateLessonRequest(
    string Title,
    LessonContentType ContentType,
    string? ContentText,
    string? VideoUrl,
    string? AttachmentUrl,
    int? ExamPassScore,
    int? ExamMaxAttempts);

public record UpdateLessonRequest(
    string Title,
    LessonContentType ContentType,
    string? ContentText,
    string? VideoUrl,
    string? AttachmentUrl,
    int? ExamPassScore,
    int? ExamMaxAttempts);

public record LessonSummaryDto(
    Guid Id,
    string Title,
    int OrderIndex,
    LessonContentType ContentType);
public record ReorderLessonsRequest(IReadOnlyList<Guid> LessonIds);