using ELearning.Application.DTOs.Exams;
using ELearning.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
public class ExamsController : ControllerBase
{
    private readonly IExamService _exams;
    public ExamsController(IExamService exams) => _exams = exams;

    // -------------------- Instructor --------------------

    [HttpGet("api/lessons/{lessonId:guid}/exam")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<ExamInstructorDto>> GetForInstructor(Guid lessonId, CancellationToken ct)
        => Ok(await _exams.GetForInstructorAsync(lessonId, ct));

    [HttpPost("api/lessons/{lessonId:guid}/exam/questions")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<ExamQuestionInstructorDto>> AddQuestion(
        Guid lessonId, UpsertExamQuestionRequest request, CancellationToken ct)
        => Ok(await _exams.AddQuestionAsync(lessonId, request, ct));

    [HttpPut("api/exam-questions/{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<ExamQuestionInstructorDto>> UpdateQuestion(
        Guid id, UpsertExamQuestionRequest request, CancellationToken ct)
        => Ok(await _exams.UpdateQuestionAsync(id, request, ct));

    [HttpDelete("api/exam-questions/{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> DeleteQuestion(Guid id, CancellationToken ct)
    {
        await _exams.DeleteQuestionAsync(id, ct);
        return NoContent();
    }

    [HttpPatch("api/lessons/{lessonId:guid}/exam/questions/reorder")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<IEnumerable<ExamQuestionInstructorDto>>> Reorder(
        Guid lessonId, ReorderExamQuestionsRequest request, CancellationToken ct)
        => Ok(await _exams.ReorderQuestionsAsync(lessonId, request, ct));

    // -------------------- Learner --------------------

    [HttpGet("api/enrollments/{enrollmentId:guid}/exam/{lessonId:guid}")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<ExamLearnerDto>> GetForLearner(
        Guid enrollmentId, Guid lessonId, CancellationToken ct)
        => Ok(await _exams.GetForLearnerAsync(enrollmentId, lessonId, ct));

    [HttpPost("api/enrollments/{enrollmentId:guid}/exam/{lessonId:guid}/submit")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<ExamResultDto>> Submit(
        Guid enrollmentId, Guid lessonId, SubmitExamRequest request, CancellationToken ct)
        => Ok(await _exams.SubmitAsync(enrollmentId, lessonId, request, ct));

    [HttpGet("api/enrollments/{enrollmentId:guid}/exam/{lessonId:guid}/attempts")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<IEnumerable<ExamAttemptSummaryDto>>> GetAttempts(
        Guid enrollmentId, Guid lessonId, CancellationToken ct)
        => Ok(await _exams.GetAttemptsAsync(enrollmentId, lessonId, ct));
}