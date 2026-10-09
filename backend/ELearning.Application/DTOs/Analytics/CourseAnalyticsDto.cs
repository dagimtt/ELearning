namespace ELearning.Application.DTOs.Analytics;

public record CourseAnalyticsDto(
    Guid CourseId,
    string CourseTitle,
    int TotalLessons,
    int TotalEnrolled,
    int Completed,
    int InProgress,
    int NotStarted,
    int CompletionRate,
    IEnumerable<LearnerProgressDto> Learners);

public record LearnerProgressDto(
    Guid LearnerId,
    string LearnerName,
    string LearnerEmail,
    DateTime EnrolledAt,
    int CompletedLessons,
    int TotalLessons,
    int ProgressPercent,
    DateTime? LastCompletedAt);

public record InstructorAnalyticsOverviewDto(
    int TotalCourses,
    int PublishedCourses,
    int TotalEnrollments,
    int TotalCompletions,
    int AverageCompletionRate,
    IEnumerable<CourseCompletionSummaryDto> Courses);

public record CourseCompletionSummaryDto(
    Guid CourseId,
    string CourseTitle,
    int TotalEnrolled,
    int Completed,
    int InProgress,
    int CompletionRate);