using ELearning.Application.DTOs.Categories;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;
    public CategoryService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<CategoryDto>> GetAllAsync(CancellationToken ct = default)
        => await _db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.Description))
            .ToListAsync(ct);

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken ct = default)
    {
        if (await _db.Categories.AnyAsync(c => c.Slug == request.Slug, ct))
            throw new InvalidOperationException("Category slug already exists.");

        var category = new Category
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);

        return new CategoryDto(category.Id, category.Name, category.Slug, category.Description);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var category = await _db.Categories.FindAsync(new object?[] { id }, ct)
            ?? throw new KeyNotFoundException("Category not found.");

        if (await _db.Courses.AnyAsync(c => c.CategoryId == id, ct))
            throw new InvalidOperationException("Cannot delete a category that has courses.");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(ct);
    }
}