using ELearning.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ELearning.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.Property(c => c.Name).IsRequired().HasMaxLength(100);
        b.Property(c => c.Slug).IsRequired().HasMaxLength(120);
        b.Property(c => c.Description).HasMaxLength(500);
        b.HasIndex(c => c.Slug).IsUnique();
    }
}