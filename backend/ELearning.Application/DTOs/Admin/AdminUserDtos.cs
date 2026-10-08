using ELearning.Application.DTOs.Common;

namespace ELearning.Application.DTOs.Admin;

public record AdminUserDto(
    Guid Id,
    string Email,
    string FullName,
    string? Bio,
    string? AvatarUrl,
    IEnumerable<string> Roles,
    DateTime CreatedAt);

public record ChangeUserRolesRequest(IReadOnlyList<string> Roles);