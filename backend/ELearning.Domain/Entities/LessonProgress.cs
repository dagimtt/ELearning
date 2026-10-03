using ELearning.Domain.Common;

namespace ELearning.Domain.Entities;

public class LessonProgress : BaseEntity
{
    public Guid EnrollmentId { get; set; }
    public Enrollment Enrollment { get; set; } = null!;

    public Guid LessonId { get; set; }
    public Lesson Lesson { get; set; } = null!;

    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}