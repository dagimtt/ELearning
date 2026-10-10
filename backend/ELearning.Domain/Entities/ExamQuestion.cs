using ELearning.Domain.Common;

namespace ELearning.Domain.Entities;

public class ExamQuestion : BaseEntity
{
    public Guid LessonId { get; set; }
    public Lesson Lesson { get; set; } = null!;

    public int OrderIndex { get; set; }
    public string QuestionText { get; set; } = string.Empty;

    // JSON: [{ "id": "a", "text": "..." }, ...]
    public string OptionsJson { get; set; } = "[]";

    // Matches one of the option ids
    public string CorrectOptionId { get; set; } = string.Empty;

    public int Points { get; set; } = 1;
}