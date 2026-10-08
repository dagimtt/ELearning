using ELearning.Application.DTOs.Enrollments;
using ELearning.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentService _enrollments;
    public EnrollmentsController(IEnrollmentService enrollments) => _enrollments = enrollments;

    // ---------- Enroll ----------

    [HttpPost("api/courses/{courseId:guid}/enroll")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<EnrollmentSummaryDto>> Enroll(Guid courseId, CancellationToken ct)
        => Ok(await _enrollments.EnrollAsync(courseId, ct));

    // ---------- Learner dashboard ----------

    [HttpGet("api/learner/enrollments")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<IEnumerable<EnrollmentSummaryDto>>> GetMine(CancellationToken ct)
        => Ok(await _enrollments.GetMyEnrollmentsAsync(ct));

    // ---------- Course player ----------

    [HttpGet("api/enrollments/{id:guid}")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<EnrollmentDetailDto>> GetDetail(Guid id, CancellationToken ct)
        => Ok(await _enrollments.GetDetailAsync(id, ct));

    [HttpGet("api/enrollments/{id:guid}/lessons/{lessonId:guid}")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<LessonContentDto>> GetLessonContent(Guid id, Guid lessonId, CancellationToken ct)
        => Ok(await _enrollments.GetLessonContentAsync(id, lessonId, ct));

    // ---------- Progress ----------

    [HttpPost("api/enrollments/{id:guid}/lessons/{lessonId:guid}/complete")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<EnrolledLessonDto>> MarkComplete(Guid id, Guid lessonId, CancellationToken ct)
        => Ok(await _enrollments.MarkCompleteAsync(id, lessonId, ct));

    [HttpDelete("api/enrollments/{id:guid}/lessons/{lessonId:guid}/complete")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<EnrolledLessonDto>> UnmarkComplete(Guid id, Guid lessonId, CancellationToken ct)
        => Ok(await _enrollments.UnmarkCompleteAsync(id, lessonId, ct));
}