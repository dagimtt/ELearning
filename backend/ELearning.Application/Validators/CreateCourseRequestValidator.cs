using ELearning.Application.DTOs.Courses;
using FluentValidation;

namespace ELearning.Application.Validators;

public class CreateCourseRequestValidator : AbstractValidator<CreateCourseRequest>
{
    public CreateCourseRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.ThumbnailUrl).MaximumLength(500);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class UpdateCourseRequestValidator : AbstractValidator<UpdateCourseRequest>
{
    public UpdateCourseRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.ThumbnailUrl).MaximumLength(500);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}