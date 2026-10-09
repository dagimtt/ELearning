using ELearning.Application.DTOs.Analytics;

namespace ELearning.Application.Interfaces;

public interface IAnalyticsService
{
    Task<CourseAnalyticsDto> GetCourseAnalyticsAsync(Guid courseId, CancellationToken ct = default);
    Task<InstructorAnalyticsOverviewDto> GetOverviewAsync(CancellationToken ct = default);
}