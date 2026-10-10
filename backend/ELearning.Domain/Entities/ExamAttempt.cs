using ELearning.Domain.Common;

namespace ELearning.Domain.Entities;

public class ExamAttempt : BaseEntity
{
    public Guid EnrollmentId { get; set; }
    public Enrollment Enrollment { get; set; } = null!;

    public Guid LessonId { get; set; }
    public Lesson Lesson { get; set; } = null!;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }

    public int Score { get; set; }              // 0-100
    public bool Passed { get; set; }
    public int PassScoreRequired { get; set; }  // snapshot at submit time

    // JSON: [{ "questionId": "...", "selectedOptionId": "a" }, ...]
    public string AnswersJson { get; set; } = "[]";

    // JSON: [{ "questionId": "...", "isCorrect": true }, ...] — for review without revealing answers
    public string ResultsJson { get; set; } = "[]";
}