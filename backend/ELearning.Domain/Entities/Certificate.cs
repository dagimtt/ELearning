using ELearning.Domain.Common;

namespace ELearning.Domain.Entities;

public class Certificate : BaseEntity
{
    public string Code { get; set; } = string.Empty;

    public Guid EnrollmentId { get; set; }
    public Enrollment Enrollment { get; set; } = null!;

    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public Guid LearnerId { get; set; }
    public AppUser Learner { get; set; } = null!;

    public Guid IssuedByInstructorId { get; set; }
    public AppUser IssuedByInstructor { get; set; } = null!;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    public string Title { get; set; } = "Certificate of Completion";
    public string? Message { get; set; }

    public DateTime? RevokedAt { get; set; }
    public string? RevokedReason { get; set; }

    public bool IsActive => RevokedAt is null;
}