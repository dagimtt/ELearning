using ELearning.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ELearning.Infrastructure.Data.Configurations;

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> b)
    {
        b.Property(c => c.Code).IsRequired().HasMaxLength(32);
        b.Property(c => c.Title).IsRequired().HasMaxLength(200);
        b.Property(c => c.Message).HasMaxLength(1000);
        b.Property(c => c.RevokedReason).HasMaxLength(500);

        b.HasIndex(c => c.Code).IsUnique();

        // One active certificate per learner per course
        b.HasIndex(c => new { c.LearnerId, c.CourseId })
            .IsUnique()
            .HasFilter("\"RevokedAt\" IS NULL");

        b.HasOne(c => c.Enrollment)
            .WithMany()
            .HasForeignKey(c => c.EnrollmentId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(c => c.Course)
            .WithMany()
            .HasForeignKey(c => c.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(c => c.Learner)
            .WithMany()
            .HasForeignKey(c => c.LearnerId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(c => c.IssuedByInstructor)
            .WithMany()
            .HasForeignKey(c => c.IssuedByInstructorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}