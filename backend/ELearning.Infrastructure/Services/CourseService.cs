using ELearning.Application.DTOs.Common;
using ELearning.Application.DTOs.Courses;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Domain.Enums;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Application.Services;

public class CourseService : ICourseService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CourseService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<CourseSummaryDto>> GetCatalogAsync(
        Guid? categoryId, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _db.Courses
            .Where(c => c.Status == CourseStatus.Published);

        if (categoryId.HasValue)
            query = query.Where(c => c.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => EF.Functions.ILike(c.Title, $"%{search}%"));

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(c => c.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CourseSummaryDto(
                c.Id,
                c.Title,
                c.Description,
                c.ThumbnailUrl,
                c.Category.Name,
                c.Instructor.FullName,
                c.Status,
                c.Lessons.Count))
            .ToListAsync(ct);

        return new PagedResult<CourseSummaryDto>(items, total, page, pageSize);
    }

    public async Task<CourseDetailDto> GetDetailAsync(Guid id, CancellationToken ct = default)
    {
        var course = await _db.Courses
            .Include(c => c.Category)
            .Include(c => c.Instructor)
            .Include(c => c.Lessons.OrderBy(l => l.OrderIndex))
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        // Drafts are only visible to their instructor or admins
        if (course.Status == CourseStatus.Draft
            && course.InstructorId != _currentUser.UserId
            && !_currentUser.IsInRole("Admin"))
        {
            throw new KeyNotFoundException("Course not found.");
        }

        return MapToDetail(course);
    }

    public async Task<IEnumerable<CourseSummaryDto>> GetMyCoursesAsync(CancellationToken ct = default)
    {
        var instructorId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        return await _db.Courses
            .Where(c => c.InstructorId == instructorId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CourseSummaryDto(
                c.Id,
                c.Title,
                c.Description,
                c.ThumbnailUrl,
                c.Category.Name,
                c.Instructor.FullName,
                c.Status,
                c.Lessons.Count))
            .ToListAsync(ct);
    }

    public async Task<CourseDetailDto> CreateAsync(CreateCourseRequest request, CancellationToken ct = default)
    {
        var instructorId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        if (!await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct))
            throw new InvalidOperationException("Category does not exist.");

        var course = new Course
        {
            Title = request.Title,
            Description = request.Description,
            ThumbnailUrl = request.ThumbnailUrl,
            CategoryId = request.CategoryId,
            InstructorId = instructorId,
            Status = CourseStatus.Draft
        };

        _db.Courses.Add(course);
        await _db.SaveChangesAsync(ct);

        // Re-query with includes for the response
        return await GetDetailAsync(course.Id, ct);
    }

    public async Task<CourseDetailDto> UpdateAsync(Guid id, UpdateCourseRequest request, CancellationToken ct = default)
    {
        var course = await GetOwnedCourseAsync(id, ct);

        if (!await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct))
            throw new InvalidOperationException("Category does not exist.");

        course.Title = request.Title;
        course.Description = request.Description;
        course.ThumbnailUrl = request.ThumbnailUrl;
        course.CategoryId = request.CategoryId;
        course.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetDetailAsync(course.Id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var course = await GetOwnedCourseAsync(id, ct);
        _db.Courses.Remove(course);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<CourseDetailDto> SetStatusAsync(Guid id, CourseStatus status, CancellationToken ct = default)
    {
        var course = await GetOwnedCourseAsync(id, ct);

        course.Status = status;
        course.PublishedAt = status == CourseStatus.Published ? DateTime.UtcNow : null;
        course.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetDetailAsync(course.Id, ct);
    }

    // ---------- helpers ----------

    private async Task<Course> GetOwnedCourseAsync(Guid id, CancellationToken ct)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        var isOwner = course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You do not own this course.");

        return course;
    }

    private static CourseDetailDto MapToDetail(Course course) => new(
        course.Id,
        course.Title,
        course.Description,
        course.ThumbnailUrl,
        course.CategoryId,
        course.Category.Name,
        course.InstructorId,
        course.Instructor.FullName,
        course.Status,
        course.PublishedAt,
        course.CreatedAt,
        course.UpdatedAt,
        course.Lessons.Select(l => new LessonSummaryDto(l.Id, l.Title, l.OrderIndex, l.ContentType)));
}