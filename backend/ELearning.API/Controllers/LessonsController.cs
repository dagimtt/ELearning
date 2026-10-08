using ELearning.Application.DTOs.Lessons;
using ELearning.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
public class LessonsController : ControllerBase
{
    private readonly ILessonService _lessons;
    public LessonsController(ILessonService lessons) => _lessons = lessons;

    // ---------- Public (published courses only) ----------

    [HttpGet("api/courses/{courseId:guid}/lessons")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PublicLessonDto>>> GetByCourse(Guid courseId, CancellationToken ct)
        => Ok(await _lessons.GetPublicByCourseAsync(courseId, ct));

    // ---------- Instructor ----------

    [HttpGet("api/lessons/{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<LessonDto>> GetById(Guid id, CancellationToken ct)
        => Ok(await _lessons.GetByIdAsync(id, ct));

    [HttpPost("api/courses/{courseId:guid}/lessons")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<LessonDto>> Create(Guid courseId, CreateLessonRequest request, CancellationToken ct)
    {
        var created = await _lessons.CreateAsync(courseId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("api/lessons/{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<LessonDto>> Update(Guid id, UpdateLessonRequest request, CancellationToken ct)
        => Ok(await _lessons.UpdateAsync(id, request, ct));

    [HttpDelete("api/lessons/{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _lessons.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPatch("api/courses/{courseId:guid}/lessons/reorder")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<IEnumerable<LessonDto>>> Reorder(
        Guid courseId, ReorderLessonsRequest request, CancellationToken ct)
        => Ok(await _lessons.ReorderAsync(courseId, request, ct));
}