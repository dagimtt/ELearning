using ELearning.Application.DTOs.Enrollments;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Domain.Enums;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Infrastructure.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public EnrollmentService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<EnrollmentSummaryDto> EnrollAsync(Guid courseId, CancellationToken ct = default)
    {
        var learnerId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var course = await _db.Courses
            .Include(c => c.Category)
            .Include(c => c.Instructor)
            .Include(c => c.Lessons)
            .FirstOrDefaultAsync(c => c.Id == courseId, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        if (course.Status != CourseStatus.Published)
            throw new InvalidOperationException("Cannot enroll in a course that is not published.");

        var already = await _db.Enrollments
            .AnyAsync(e => e.LearnerId == learnerId && e.CourseId == courseId, ct);

        if (already)
            throw new InvalidOperationException("You are already enrolled in this course.");

        var enrollment = new Enrollment
        {
            LearnerId = learnerId,
            CourseId = courseId,
            EnrolledAt = DateTime.UtcNow
        };

        _db.Enrollments.Add(enrollment);
        await _db.SaveChangesAsync(ct);

        return new EnrollmentSummaryDto(
            enrollment.Id,
            course.Id,
            course.Title,
            course.ThumbnailUrl,
            course.Category.Name,
            course.Instructor.FullName,
            course.Lessons.Count,
            0,
            0,
            enrollment.EnrolledAt);
    }

    public async Task<IEnumerable<EnrollmentSummaryDto>> GetMyEnrollmentsAsync(CancellationToken ct = default)
    {
        var learnerId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var rows = await _db.Enrollments
            .Where(e => e.LearnerId == learnerId)
            .OrderByDescending(e => e.EnrolledAt)
            .Select(e => new
            {
                e.Id,
                e.EnrolledAt,
                CourseId = e.Course.Id,
                CourseTitle = e.Course.Title,
                e.Course.ThumbnailUrl,
                CategoryName = e.Course.Category.Name,
                InstructorName = e.Course.Instructor.FullName,
                TotalLessons = e.Course.Lessons.Count,
                CompletedLessons = e.ProgressRecords.Count
            })
            .ToListAsync(ct);

        return rows.Select(r => new EnrollmentSummaryDto(
            r.Id,
            r.CourseId,
            r.CourseTitle,
            r.ThumbnailUrl,
            r.CategoryName,
            r.InstructorName,
            r.TotalLessons,
            r.CompletedLessons,
            Percent(r.CompletedLessons, r.TotalLessons),
            r.EnrolledAt));
    }

    public async Task<EnrollmentDetailDto> GetDetailAsync(Guid enrollmentId, CancellationToken ct = default)
    {
        var enrollment = await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        var lessons = enrollment.Course.Lessons
            .OrderBy(l => l.OrderIndex)
            .Select(l =>
            {
                var progress = enrollment.ProgressRecords.FirstOrDefault(p => p.LessonId == l.Id);
                return new EnrolledLessonDto(
                    l.Id, l.Title, l.OrderIndex, l.ContentType,
                    progress is not null, progress?.CompletedAt);
            })
            .ToList();

        var completed = enrollment.ProgressRecords.Count;
        var total = lessons.Count;

        return new EnrollmentDetailDto(
            enrollment.Id,
            enrollment.CourseId,
            enrollment.Course.Title,
            enrollment.Course.Description,
            enrollment.Course.ThumbnailUrl,
            enrollment.Course.Category.Name,
            enrollment.Course.Instructor.FullName,
            total,
            completed,
            Percent(completed, total),
            enrollment.EnrolledAt,
            lessons);
    }

    public async Task<LessonContentDto> GetLessonContentAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default)
    {
        var enrollment = await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        var lesson = enrollment.Course.Lessons.FirstOrDefault(l => l.Id == lessonId)
            ?? throw new KeyNotFoundException("Lesson not found in this course.");

        var progress = enrollment.ProgressRecords.FirstOrDefault(p => p.LessonId == lessonId);

        return new LessonContentDto(
            lesson.Id, lesson.CourseId, lesson.Title, lesson.OrderIndex, lesson.ContentType,
            lesson.ContentText, lesson.VideoUrl, lesson.AttachmentUrl,
            progress is not null, progress?.CompletedAt);
    }

    public async Task<EnrolledLessonDto> MarkCompleteAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default)
    {
        var enrollment = await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        var lesson = enrollment.Course.Lessons.FirstOrDefault(l => l.Id == lessonId)
            ?? throw new KeyNotFoundException("Lesson not found in this course.");

        var existing = enrollment.ProgressRecords.FirstOrDefault(p => p.LessonId == lessonId);
        if (existing is not null)
            return new EnrolledLessonDto(lesson.Id, lesson.Title, lesson.OrderIndex, lesson.ContentType, true, existing.CompletedAt);
if (lesson.ContentType == LessonContentType.Exam)
    throw new InvalidOperationException(
        "Exam lessons cannot be marked complete manually. Submit the exam to earn completion.");
        var progress = new LessonProgress
        {
            EnrollmentId = enrollment.Id,
            LessonId = lessonId,
            CompletedAt = DateTime.UtcNow
        };
        _db.LessonProgresses.Add(progress);
        await _db.SaveChangesAsync(ct);

        return new EnrolledLessonDto(lesson.Id, lesson.Title, lesson.OrderIndex, lesson.ContentType, true, progress.CompletedAt);
    }

    public async Task<EnrolledLessonDto> UnmarkCompleteAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default)
    {
        var enrollment = await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        var lesson = enrollment.Course.Lessons.FirstOrDefault(l => l.Id == lessonId)
            ?? throw new KeyNotFoundException("Lesson not found in this course.");

        var existing = enrollment.ProgressRecords.FirstOrDefault(p => p.LessonId == lessonId);
        if (existing is not null)
        {
            _db.LessonProgresses.Remove(existing);
            await _db.SaveChangesAsync(ct);
        }

        return new EnrolledLessonDto(lesson.Id, lesson.Title, lesson.OrderIndex, lesson.ContentType, false, null);
    }

    // ---------- helpers ----------

    private async Task<Enrollment> LoadOwnedEnrollmentAsync(Guid enrollmentId, CancellationToken ct)
    {
        var learnerId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var enrollment = await _db.Enrollments
            .Include(e => e.Course).ThenInclude(c => c.Category)
            .Include(e => e.Course).ThenInclude(c => c.Instructor)
            .Include(e => e.Course).ThenInclude(c => c.Lessons)
            .Include(e => e.ProgressRecords)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, ct)
            ?? throw new KeyNotFoundException("Enrollment not found.");

        if (enrollment.LearnerId != learnerId && !_currentUser.IsInRole("Admin"))
            throw new UnauthorizedAccessException("This enrollment belongs to another learner.");

        return enrollment;
    }

    private static int Percent(int completed, int total)
        => total == 0 ? 0 : (int)Math.Round(completed * 100.0 / total);
}