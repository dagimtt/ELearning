using ELearning.Application.DTOs.Analytics;
using ELearning.Application.Interfaces;
using ELearning.Domain.Enums;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AnalyticsService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<CourseAnalyticsDto> GetCourseAnalyticsAsync(Guid courseId, CancellationToken ct = default)
    {
        var instructorId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var course = await _db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == courseId, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        if (course.InstructorId != instructorId && !_currentUser.IsInRole("Admin"))
            throw new UnauthorizedAccessException("You do not own this course.");

        var totalLessons = await _db.Lessons
            .Where(l => l.CourseId == courseId)
            .CountAsync(ct);

        // Load enrollments + progress in one query
        var enrollments = await _db.Enrollments
            .Where(e => e.CourseId == courseId)
            .Include(e => e.Learner)
            .Include(e => e.ProgressRecords)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync(ct);

        var learners = enrollments.Select(e =>
        {
            var completed = e.ProgressRecords.Count;
            var percent = totalLessons == 0 ? 0 : (int)Math.Round(completed * 100.0 / totalLessons);
            var lastCompleted = e.ProgressRecords
                .OrderByDescending(p => p.CompletedAt)
                .FirstOrDefault()?.CompletedAt;

            return new LearnerProgressDto(
                e.LearnerId,
                e.Learner.FullName,
                e.Learner.Email ?? "",
                e.EnrolledAt,
                completed,
                totalLessons,
                percent,
                lastCompleted);
        }).ToList();

        var totalEnrolled = learners.Count;
        var completedCount = learners.Count(l => l.ProgressPercent == 100);
        var notStarted = learners.Count(l => l.CompletedLessons == 0);
        var inProgress = totalEnrolled - completedCount - notStarted;
        var completionRate = totalEnrolled == 0
            ? 0
            : (int)Math.Round(completedCount * 100.0 / totalEnrolled);

        return new CourseAnalyticsDto(
            course.Id,
            course.Title,
            totalLessons,
            totalEnrolled,
            completedCount,
            inProgress,
            notStarted,
            completionRate,
            learners);
    }

    public async Task<InstructorAnalyticsOverviewDto> GetOverviewAsync(CancellationToken ct = default)
    {
        var instructorId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var courses = await _db.Courses
            .Where(c => c.InstructorId == instructorId)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Status,
                LessonCount = c.Lessons.Count,
                Enrollments = c.Enrollments.Select(e => new
                {
                    CompletedLessons = e.ProgressRecords.Count,
                }).ToList()
            })
            .ToListAsync(ct);

        var summaries = courses.Select(c =>
        {
            var totalEnrolled = c.Enrollments.Count;
            var completed = c.Enrollments.Count(e =>
                c.LessonCount > 0 && e.CompletedLessons == c.LessonCount);
            var inProgress = totalEnrolled - completed;
            var rate = totalEnrolled == 0
                ? 0
                : (int)Math.Round(completed * 100.0 / totalEnrolled);

            return new CourseCompletionSummaryDto(
                c.Id,
                c.Title,
                totalEnrolled,
                completed,
                inProgress,
                rate);
        }).ToList();

        var totalEnrollments = summaries.Sum(s => s.TotalEnrolled);
        var totalCompletions = summaries.Sum(s => s.Completed);
        var avgRate = summaries.Count == 0
            ? 0
            : (int)Math.Round(summaries.Average(s => s.CompletionRate));

        return new InstructorAnalyticsOverviewDto(
            courses.Count,
            courses.Count(c => c.Status == CourseStatus.Published),
            totalEnrollments,
            totalCompletions,
            avgRate,
            summaries);
    }
}