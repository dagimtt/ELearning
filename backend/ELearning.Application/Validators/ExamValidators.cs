using ELearning.Application.DTOs.Exams;
using FluentValidation;

namespace ELearning.Application.Validators;

public class UpsertExamQuestionRequestValidator : AbstractValidator<UpsertExamQuestionRequest>
{
    public UpsertExamQuestionRequestValidator()
    {
        RuleFor(x => x.QuestionText).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Points).InclusiveBetween(1, 100);

        RuleFor(x => x.Options)
            .NotNull()
            .Must(o => o.Count() >= 2).WithMessage("At least 2 options are required.")
            .Must(o => o.Count() <= 6).WithMessage("At most 6 options are allowed.");

        RuleFor(x => x.Options)
            .Must(opts => opts.Select(o => o.Id).Distinct().Count() == opts.Count())
            .WithMessage("Option IDs must be unique.");

        RuleFor(x => x.Options)
            .Must(opts => opts.All(o => !string.IsNullOrWhiteSpace(o.Text) && o.Text.Length <= 500))
            .WithMessage("Option text is required and must be 500 characters or less.");

        RuleFor(x => x.CorrectOptionId)
            .NotEmpty()
            .Must((req, correctId) => req.Options.Any(o => o.Id == correctId))
            .WithMessage("CorrectOptionId must match one of the option IDs.");
    }
}