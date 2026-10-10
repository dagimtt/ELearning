using ELearning.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ELearning.Infrastructure.Data.Configurations;

public class ExamQuestionConfiguration : IEntityTypeConfiguration<ExamQuestion>
{
    public void Configure(EntityTypeBuilder<ExamQuestion> b)
    {
        b.Property(q => q.QuestionText).IsRequired().HasColumnType("text");
        b.Property(q => q.OptionsJson).IsRequired().HasColumnType("jsonb");
        b.Property(q => q.CorrectOptionId).IsRequired().HasMaxLength(50);

        b.HasOne(q => q.Lesson)
            .WithMany()
            .HasForeignKey(q => q.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(q => new { q.LessonId, q.OrderIndex });
    }
}