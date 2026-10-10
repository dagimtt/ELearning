using ELearning.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ELearning.Infrastructure.Data.Configurations;

public class ExamAttemptConfiguration : IEntityTypeConfiguration<ExamAttempt>
{
    public void Configure(EntityTypeBuilder<ExamAttempt> b)
    {
        b.Property(a => a.AnswersJson).IsRequired().HasColumnType("jsonb");
        b.Property(a => a.ResultsJson).IsRequired().HasColumnType("jsonb");

        b.HasOne(a => a.Enrollment)
            .WithMany()
            .HasForeignKey(a => a.EnrollmentId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(a => a.Lesson)
            .WithMany()
            .HasForeignKey(a => a.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(a => new { a.EnrollmentId, a.LessonId, a.StartedAt });
    }
}