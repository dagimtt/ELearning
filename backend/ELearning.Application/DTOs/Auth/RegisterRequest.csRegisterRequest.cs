namespace ELearning.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string Role); // "Learner" or "Instructor"