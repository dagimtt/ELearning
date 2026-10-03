namespace ELearning.Application.DTOs.Auth;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    UserDto User);

public record UserDto(Guid Id, string Email, string FullName, IEnumerable<string> Roles);