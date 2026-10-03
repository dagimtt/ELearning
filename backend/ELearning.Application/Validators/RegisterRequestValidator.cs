using ELearning.Application.DTOs.Auth;
using FluentValidation;

namespace ELearning.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    private static readonly string[] AllowedRoles = { "Learner", "Instructor" };

    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Role).Must(r => AllowedRoles.Contains(r))
            .WithMessage("Role must be Learner or Instructor.");
    }
}