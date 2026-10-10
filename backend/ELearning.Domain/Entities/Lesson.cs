using ELearning.Domain.Common;
using ELearning.Domain.Enums;

namespace ELearning.Domain.Entities;

public class Lesson : BaseEntity
{
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public LessonContentType ContentType { get; set; } = LessonContentType.Text;
    public string? ContentText { get; set; }
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }

    public int OrderIndex { get; set; }
    public int? ExamPassScore { get; set; }       // 0-100, null if not an exam
    public int? ExamMaxAttempts { get; set; }     // null = unlimited
    public ICollection<LessonProgress> ProgressRecords { get; set; } = new List<LessonProgress>();
}