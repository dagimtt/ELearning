using ELearning.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ELearning.Infrastructure.Data.Configurations;

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> b)
    {
        b.HasOne(e => e.Learner)
            .WithMany(u => u.Enrollments)
            .HasForeignKey(e => e.LearnerId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(e => e.Course)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(e => new { e.LearnerId, e.CourseId }).IsUnique();
    }
}