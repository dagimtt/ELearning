using ELearning.Application.DTOs.Common;
using ELearning.Application.DTOs.Courses;
using ELearning.Application.Interfaces;
using ELearning.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courses;
    public CoursesController(ICourseService courses) => _courses = courses;

    // ---------- Public ----------

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<CourseSummaryDto>>> GetCatalog(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
        => Ok(await _courses.GetCatalogAsync(categoryId, search, page, pageSize, ct));

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<CourseDetailDto>> GetDetail(Guid id, CancellationToken ct)
        => Ok(await _courses.GetDetailAsync(id, ct));

    // ---------- Instructor ----------

    [HttpGet("mine")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<IEnumerable<CourseSummaryDto>>> GetMine(CancellationToken ct)
        => Ok(await _courses.GetMyCoursesAsync(ct));

    [HttpPost]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<CourseDetailDto>> Create(CreateCourseRequest request, CancellationToken ct)
    {
        var created = await _courses.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetDetail), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<CourseDetailDto>> Update(Guid id, UpdateCourseRequest request, CancellationToken ct)
        => Ok(await _courses.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _courses.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<CourseDetailDto>> Publish(Guid id, CancellationToken ct)
        => Ok(await _courses.SetStatusAsync(id, CourseStatus.Published, ct));

    [HttpPost("{id:guid}/unpublish")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<CourseDetailDto>> Unpublish(Guid id, CancellationToken ct)
        => Ok(await _courses.SetStatusAsync(id, CourseStatus.Draft, ct));
}