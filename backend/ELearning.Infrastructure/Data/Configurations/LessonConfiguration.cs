using ELearning.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ELearning.Infrastructure.Data.Configurations;

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> b)
    {
        b.Property(l => l.Title).IsRequired().HasMaxLength(200);
        b.Property(l => l.ContentText).HasColumnType("text");
        b.Property(l => l.VideoUrl).HasMaxLength(500);
        b.Property(l => l.AttachmentUrl).HasMaxLength(500);

        b.HasOne(l => l.Course)
            .WithMany(c => c.Lessons)
            .HasForeignKey(l => l.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(l => new { l.CourseId, l.OrderIndex });
    }
}