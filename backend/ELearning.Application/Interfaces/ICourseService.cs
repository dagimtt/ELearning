using ELearning.Application.DTOs.Common;
using ELearning.Application.DTOs.Courses;
using ELearning.Domain.Enums;

namespace ELearning.Application.Interfaces;

public interface ICourseService
{
    // Public catalog
    Task<PagedResult<CourseSummaryDto>> GetCatalogAsync(
        Guid? categoryId, string? search, int page, int pageSize, CancellationToken ct = default);

    // Public detail — hides drafts from non-owners
    Task<CourseDetailDto> GetDetailAsync(Guid id, CancellationToken ct = default);

    // Instructor
    Task<IEnumerable<CourseSummaryDto>> GetMyCoursesAsync(CancellationToken ct = default);
    Task<CourseDetailDto> CreateAsync(CreateCourseRequest request, CancellationToken ct = default);
    Task<CourseDetailDto> UpdateAsync(Guid id, UpdateCourseRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<CourseDetailDto> SetStatusAsync(Guid id, CourseStatus status, CancellationToken ct = default);
}