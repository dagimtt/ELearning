using ELearning.Domain.Common;

namespace ELearning.Domain.Entities;

public class Enrollment : BaseEntity
{
    public Guid LearnerId { get; set; }
    public AppUser Learner { get; set; } = null!;

    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public ICollection<LessonProgress> ProgressRecords { get; set; } = new List<LessonProgress>();
}