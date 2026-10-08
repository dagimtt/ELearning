using ELearning.Application.DTOs.Lessons;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Domain.Enums;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Infrastructure.Services;

public class LessonService : ILessonService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public LessonService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IEnumerable<PublicLessonDto>> GetPublicByCourseAsync(Guid courseId, CancellationToken ct = default)
    {
        var course = await _db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == courseId, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        var isOwner = course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");

        // Public view requires published course. Owners/admins can preview drafts.
        if (course.Status != CourseStatus.Published && !isOwner && !isAdmin)
            throw new KeyNotFoundException("Course not found.");

        return await _db.Lessons
            .Where(l => l.CourseId == courseId)
            .OrderBy(l => l.OrderIndex)
            .Select(l => new PublicLessonDto(
                l.Id, l.Title, l.ContentType, l.ContentText, l.VideoUrl, l.AttachmentUrl, l.OrderIndex))
            .ToListAsync(ct);
    }

    public async Task<LessonDto> GetByIdAsync(Guid lessonId, CancellationToken ct = default)
    {
        var lesson = await _db.Lessons
            .Include(l => l.Course)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found.");

        var isOwner = lesson.Course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You do not own this lesson.");

        return Map(lesson);
    }

    public async Task<LessonDto> CreateAsync(Guid courseId, CreateLessonRequest request, CancellationToken ct = default)
    {
        var course = await GetOwnedCourseAsync(courseId, ct);

        var nextOrder = await _db.Lessons
            .Where(l => l.CourseId == courseId)
            .Select(l => (int?)l.OrderIndex)
            .MaxAsync(ct) ?? -1;

        var lesson = new Lesson
        {
            CourseId = courseId,
            Title = request.Title,
            ContentType = request.ContentType,
            ContentText = request.ContentType == LessonContentType.Text ? request.ContentText : null,
            VideoUrl = request.ContentType == LessonContentType.Video ? request.VideoUrl : null,
            AttachmentUrl = request.ContentType == LessonContentType.Attachment ? request.AttachmentUrl : null,
            OrderIndex = nextOrder + 1
        };

        _db.Lessons.Add(lesson);
        await _db.SaveChangesAsync(ct);

        return Map(lesson);
    }

    public async Task<LessonDto> UpdateAsync(Guid lessonId, UpdateLessonRequest request, CancellationToken ct = default)
    {
        var lesson = await GetOwnedLessonAsync(lessonId, ct);

        lesson.Title = request.Title;
        lesson.ContentType = request.ContentType;
        lesson.ContentText = request.ContentType == LessonContentType.Text ? request.ContentText : null;
        lesson.VideoUrl = request.ContentType == LessonContentType.Video ? request.VideoUrl : null;
        lesson.AttachmentUrl = request.ContentType == LessonContentType.Attachment ? request.AttachmentUrl : null;
        lesson.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Map(lesson);
    }

    public async Task DeleteAsync(Guid lessonId, CancellationToken ct = default)
    {
        var lesson = await GetOwnedLessonAsync(lessonId, ct);
        var courseId = lesson.CourseId;
        var deletedOrder = lesson.OrderIndex;

        _db.Lessons.Remove(lesson);

        // Compact: shift everything above the deleted slot down by 1
        var toShift = await _db.Lessons
            .Where(l => l.CourseId == courseId && l.OrderIndex > deletedOrder)
            .ToListAsync(ct);

        foreach (var l in toShift)
            l.OrderIndex -= 1;

        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<LessonDto>> ReorderAsync(Guid courseId, ReorderLessonsRequest request, CancellationToken ct = default)
    {
        await GetOwnedCourseAsync(courseId, ct);

        var lessons = await _db.Lessons
            .Where(l => l.CourseId == courseId)
            .ToListAsync(ct);

        if (lessons.Count != request.LessonIds.Count
            || !lessons.Select(l => l.Id).ToHashSet().SetEquals(request.LessonIds))
        {
            throw new InvalidOperationException(
                "LessonIds must contain exactly the set of lesson IDs for this course.");
        }

        // Rewrite OrderIndex by position in the request list
        for (var i = 0; i < request.LessonIds.Count; i++)
        {
            var id = request.LessonIds[i];
            var lesson = lessons.First(l => l.Id == id);
            lesson.OrderIndex = i;
            lesson.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return lessons
            .OrderBy(l => l.OrderIndex)
            .Select(Map)
            .ToList();
    }

    // ---------- helpers ----------

    private async Task<Course> GetOwnedCourseAsync(Guid courseId, CancellationToken ct)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == courseId, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        var isOwner = course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You do not own this course.");

        return course;
    }

    private async Task<Lesson> GetOwnedLessonAsync(Guid lessonId, CancellationToken ct)
    {
        var lesson = await _db.Lessons
            .Include(l => l.Course)
            .FirstOrDefaultAsync(l => l.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found.");

        var isOwner = lesson.Course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You do not own this lesson.");

        return lesson;
    }

    private static LessonDto Map(Lesson l) => new(
        l.Id, l.CourseId, l.Title, l.ContentType,
        l.ContentText, l.VideoUrl, l.AttachmentUrl,
        l.OrderIndex, l.CreatedAt, l.UpdatedAt);
}