namespace ELearning.Application.DTOs.Categories;

public record CategoryDto(Guid Id, string Name, string Slug, string? Description);

public record CreateCategoryRequest(string Name, string Slug, string? Description);
