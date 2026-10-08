using ELearning.Application.DTOs.Lessons;
using ELearning.Domain.Enums;
using FluentValidation;

namespace ELearning.Application.Validators;

public class CreateLessonRequestValidator : AbstractValidator<CreateLessonRequest>
{
    public CreateLessonRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ContentType).IsInEnum();
        RuleFor(x => x.ContentText).MaximumLength(50_000);
        RuleFor(x => x.VideoUrl).MaximumLength(500);
        RuleFor(x => x.AttachmentUrl).MaximumLength(500);

        // Content-type specific rules
        When(x => x.ContentType == LessonContentType.Text, () =>
        {
            RuleFor(x => x.ContentText).NotEmpty()
                .WithMessage("Text lessons require ContentText.");
        });

        When(x => x.ContentType == LessonContentType.Video, () =>
        {
            RuleFor(x => x.VideoUrl).NotEmpty()
                .WithMessage("Video lessons require VideoUrl.");
        });

        When(x => x.ContentType == LessonContentType.Attachment, () =>
        {
            RuleFor(x => x.AttachmentUrl).NotEmpty()
                .WithMessage("Attachment lessons require AttachmentUrl.");
        });
    }
}

public class UpdateLessonRequestValidator : AbstractValidator<UpdateLessonRequest>
{
    public UpdateLessonRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ContentType).IsInEnum();
        RuleFor(x => x.ContentText).MaximumLength(50_000);
        RuleFor(x => x.VideoUrl).MaximumLength(500);
        RuleFor(x => x.AttachmentUrl).MaximumLength(500);

        When(x => x.ContentType == LessonContentType.Text, () =>
        {
            RuleFor(x => x.ContentText).NotEmpty()
                .WithMessage("Text lessons require ContentText.");
        });

        When(x => x.ContentType == LessonContentType.Video, () =>
        {
            RuleFor(x => x.VideoUrl).NotEmpty()
                .WithMessage("Video lessons require VideoUrl.");
        });

        When(x => x.ContentType == LessonContentType.Attachment, () =>
        {
            RuleFor(x => x.AttachmentUrl).NotEmpty()
                .WithMessage("Attachment lessons require AttachmentUrl.");
        });
    }
}