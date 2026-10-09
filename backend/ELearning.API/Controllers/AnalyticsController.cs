using ELearning.Application.DTOs.Analytics;
using ELearning.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
[Authorize(Roles = "Instructor")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analytics;
    public AnalyticsController(IAnalyticsService analytics) => _analytics = analytics;

    [HttpGet("api/instructor/courses/{courseId:guid}/analytics")]
    public async Task<ActionResult<CourseAnalyticsDto>> GetCourseAnalytics(Guid courseId, CancellationToken ct)
        => Ok(await _analytics.GetCourseAnalyticsAsync(courseId, ct));

    [HttpGet("api/instructor/analytics/overview")]
    public async Task<ActionResult<InstructorAnalyticsOverviewDto>> GetOverview(CancellationToken ct)
        => Ok(await _analytics.GetOverviewAsync(ct));
}