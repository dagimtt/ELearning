using System.Text.Json;
using ELearning.Application.DTOs.Exams;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Domain.Enums;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Infrastructure.Services;

public class ExamService : IExamService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ExamService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // -------------------- Instructor --------------------

    public async Task<ExamInstructorDto> GetForInstructorAsync(Guid lessonId, CancellationToken ct = default)
    {
        var lesson = await LoadOwnedExamLessonAsync(lessonId, ct);

        var questions = await _db.ExamQuestions
            .Where(q => q.LessonId == lessonId)
            .OrderBy(q => q.OrderIndex)
            .ToListAsync(ct);

        return new ExamInstructorDto(
            lesson.Id,
            lesson.CourseId,
            lesson.Title,
            lesson.ContentText,
            lesson.ExamPassScore ?? 70,
            lesson.ExamMaxAttempts,
            questions.Select(ToInstructorDto));
    }

    public async Task<ExamQuestionInstructorDto> AddQuestionAsync(
        Guid lessonId, UpsertExamQuestionRequest request, CancellationToken ct = default)
    {
        await LoadOwnedExamLessonAsync(lessonId, ct);

        var nextOrder = await _db.ExamQuestions
            .Where(q => q.LessonId == lessonId)
            .Select(q => (int?)q.OrderIndex)
            .MaxAsync(ct) ?? -1;

        var question = new ExamQuestion
        {
            LessonId = lessonId,
            OrderIndex = nextOrder + 1,
            QuestionText = request.QuestionText,
            OptionsJson = JsonSerializer.Serialize(request.Options),
            CorrectOptionId = request.CorrectOptionId,
            Points = request.Points
        };

        _db.ExamQuestions.Add(question);
        await _db.SaveChangesAsync(ct);

        return ToInstructorDto(question);
    }

    public async Task<ExamQuestionInstructorDto> UpdateQuestionAsync(
        Guid questionId, UpsertExamQuestionRequest request, CancellationToken ct = default)
    {
        var question = await LoadOwnedQuestionAsync(questionId, ct);

        question.QuestionText = request.QuestionText;
        question.OptionsJson = JsonSerializer.Serialize(request.Options);
        question.CorrectOptionId = request.CorrectOptionId;
        question.Points = request.Points;
        question.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ToInstructorDto(question);
    }

    public async Task DeleteQuestionAsync(Guid questionId, CancellationToken ct = default)
    {
        var question = await LoadOwnedQuestionAsync(questionId, ct);
        var lessonId = question.LessonId;
        var removedOrder = question.OrderIndex;

        _db.ExamQuestions.Remove(question);

        // Compact order
        var toShift = await _db.ExamQuestions
            .Where(q => q.LessonId == lessonId && q.OrderIndex > removedOrder)
            .ToListAsync(ct);

        foreach (var q in toShift)
            q.OrderIndex -= 1;

        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<ExamQuestionInstructorDto>> ReorderQuestionsAsync(
        Guid lessonId, ReorderExamQuestionsRequest request, CancellationToken ct = default)
    {
        await LoadOwnedExamLessonAsync(lessonId, ct);

        var questions = await _db.ExamQuestions
            .Where(q => q.LessonId == lessonId)
            .ToListAsync(ct);

        if (questions.Count != request.QuestionIds.Count
            || !questions.Select(q => q.Id).ToHashSet().SetEquals(request.QuestionIds))
        {
            throw new InvalidOperationException(
                "QuestionIds must contain exactly the set of question IDs for this lesson.");
        }

        for (var i = 0; i < request.QuestionIds.Count; i++)
        {
            var q = questions.First(x => x.Id == request.QuestionIds[i]);
            q.OrderIndex = i;
            q.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return questions
            .OrderBy(q => q.OrderIndex)
            .Select(ToInstructorDto);
    }

    // -------------------- Learner --------------------

    public async Task<ExamLearnerDto> GetForLearnerAsync(
        Guid enrollmentId, Guid lessonId, CancellationToken ct = default)
    {
        var enrollment = await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        var lesson = await _db.Lessons
            .FirstOrDefaultAsync(l => l.Id == lessonId && l.CourseId == enrollment.CourseId, ct)
            ?? throw new KeyNotFoundException("Lesson not found in this course.");

        if (lesson.ContentType != LessonContentType.Exam)
            throw new InvalidOperationException("This lesson is not an exam.");

        var questions = await _db.ExamQuestions
            .Where(q => q.LessonId == lessonId)
            .OrderBy(q => q.OrderIndex)
            .ToListAsync(ct);

        var attempts = await _db.ExamAttempts
            .Where(a => a.EnrollmentId == enrollmentId && a.LessonId == lessonId && a.SubmittedAt != null)
            .ToListAsync(ct);

        var alreadyPassed = attempts.Any(a => a.Passed);
        var bestScore = attempts.Any() ? attempts.Max(a => a.Score) : (int?)null;

        return new ExamLearnerDto(
            lesson.Id,
            enrollment.CourseId,
            enrollmentId,
            lesson.Title,
            lesson.ContentText,
            lesson.ExamPassScore ?? 70,
            lesson.ExamMaxAttempts,
            attempts.Count,
            bestScore,
            alreadyPassed,
            questions.Select(ToLearnerDto));
    }

    public async Task<ExamResultDto> SubmitAsync(
        Guid enrollmentId, Guid lessonId, SubmitExamRequest request, CancellationToken ct = default)
    {
        var enrollment = await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        var lesson = await _db.Lessons
            .FirstOrDefaultAsync(l => l.Id == lessonId && l.CourseId == enrollment.CourseId, ct)
            ?? throw new KeyNotFoundException("Lesson not found in this course.");

        if (lesson.ContentType != LessonContentType.Exam)
            throw new InvalidOperationException("This lesson is not an exam.");

        var questions = await _db.ExamQuestions
            .Where(q => q.LessonId == lessonId)
            .ToListAsync(ct);

        if (questions.Count == 0)
            throw new InvalidOperationException("This exam has no questions yet.");

        // Check attempt limit
        var priorAttempts = await _db.ExamAttempts
            .Where(a => a.EnrollmentId == enrollmentId && a.LessonId == lessonId && a.SubmittedAt != null)
            .CountAsync(ct);

        if (lesson.ExamMaxAttempts.HasValue && priorAttempts >= lesson.ExamMaxAttempts.Value)
            throw new InvalidOperationException(
                $"Maximum attempts ({lesson.ExamMaxAttempts}) reached for this exam.");

        // Grade
        var answerLookup = request.Answers
            .GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.First().SelectedOptionId);

        var results = new List<ExamQuestionResultDto>();
        var correctCount = 0;

        foreach (var q in questions)
        {
            var selected = answerLookup.TryGetValue(q.Id, out var s) ? s : null;
            var isCorrect = selected == q.CorrectOptionId;
            if (isCorrect) correctCount++;
            results.Add(new ExamQuestionResultDto(q.Id, isCorrect));
        }

        var score = (int)Math.Round(correctCount * 100.0 / questions.Count);
        var passScore = lesson.ExamPassScore ?? 70;
        var passed = score >= passScore;

        var attempt = new ExamAttempt
        {
            EnrollmentId = enrollmentId,
            LessonId = lessonId,
            StartedAt = DateTime.UtcNow.AddMinutes(-1),   // approximation; add a separate "start" endpoint later
            SubmittedAt = DateTime.UtcNow,
            Score = score,
            Passed = passed,
            PassScoreRequired = passScore,
            AnswersJson = JsonSerializer.Serialize(request.Answers),
            ResultsJson = JsonSerializer.Serialize(results)
        };

        _db.ExamAttempts.Add(attempt);

        // If passed and this is the first pass, create LessonProgress
        bool lessonMarkedComplete = false;
        if (passed)
        {
            var existingProgress = await _db.LessonProgresses
                .FirstOrDefaultAsync(p => p.EnrollmentId == enrollmentId && p.LessonId == lessonId, ct);

            if (existingProgress is null)
            {
                _db.LessonProgresses.Add(new LessonProgress
                {
                    EnrollmentId = enrollmentId,
                    LessonId = lessonId,
                    CompletedAt = DateTime.UtcNow
                });
                lessonMarkedComplete = true;
            }
        }

        await _db.SaveChangesAsync(ct);

        return new ExamResultDto(
            attempt.Id,
            score,
            passScore,
            passed,
            correctCount,
            questions.Count,
            results,
            lessonMarkedComplete);
    }

    public async Task<IEnumerable<ExamAttemptSummaryDto>> GetAttemptsAsync(
        Guid enrollmentId, Guid lessonId, CancellationToken ct = default)
    {
        await LoadOwnedEnrollmentAsync(enrollmentId, ct);

        return await _db.ExamAttempts
            .Where(a => a.EnrollmentId == enrollmentId && a.LessonId == lessonId && a.SubmittedAt != null)
            .OrderByDescending(a => a.SubmittedAt)
            .Select(a => new ExamAttemptSummaryDto(
                a.Id, a.StartedAt, a.SubmittedAt, a.Score, a.Passed, a.PassScoreRequired))
            .ToListAsync(ct);
    }

    // -------------------- Helpers --------------------

    private async Task<Lesson> LoadOwnedExamLessonAsync(Guid lessonId, CancellationToken ct)
    {
        var lesson = await _db.Lessons
            .Include(l => l.Course)
            .FirstOrDefaultAsync(l => l.Id == lessonId, ct)
            ?? throw new KeyNotFoundException("Lesson not found.");

        var isOwner = lesson.Course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");
        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You do not own this lesson.");

        if (lesson.ContentType != LessonContentType.Exam)
            throw new InvalidOperationException("This lesson is not an exam.");

        return lesson;
    }

    private async Task<ExamQuestion> LoadOwnedQuestionAsync(Guid questionId, CancellationToken ct)
    {
        var question = await _db.ExamQuestions
            .Include(q => q.Lesson).ThenInclude(l => l.Course)
            .FirstOrDefaultAsync(q => q.Id == questionId, ct)
            ?? throw new KeyNotFoundException("Question not found.");

        var isOwner = question.Lesson.Course.InstructorId == _currentUser.UserId;
        var isAdmin = _currentUser.IsInRole("Admin");
        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You do not own this question.");

        return question;
    }

    private async Task<Enrollment> LoadOwnedEnrollmentAsync(Guid enrollmentId, CancellationToken ct)
    {
        var learnerId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var enrollment = await _db.Enrollments
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, ct)
            ?? throw new KeyNotFoundException("Enrollment not found.");

        if (enrollment.LearnerId != learnerId && !_currentUser.IsInRole("Admin"))
            throw new UnauthorizedAccessException("This enrollment belongs to another learner.");

        return enrollment;
    }

    private static ExamQuestionInstructorDto ToInstructorDto(ExamQuestion q) => new(
        q.Id,
        q.OrderIndex,
        q.QuestionText,
        JsonSerializer.Deserialize<List<ExamOptionDto>>(q.OptionsJson) ?? new(),
        q.CorrectOptionId,
        q.Points);

    private static ExamQuestionLearnerDto ToLearnerDto(ExamQuestion q) => new(
        q.Id,
        q.OrderIndex,
        q.QuestionText,
        JsonSerializer.Deserialize<List<ExamOptionDto>>(q.OptionsJson) ?? new(),
        q.Points);
}