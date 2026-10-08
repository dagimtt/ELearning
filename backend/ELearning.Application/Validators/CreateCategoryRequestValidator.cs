using ELearning.Application.DTOs.Categories;
using FluentValidation;

namespace ELearning.Application.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(120)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug must be lowercase letters, numbers, and hyphens.");
        RuleFor(x => x.Description).MaximumLength(500);
    }
}