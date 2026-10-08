using ELearning.Application.DTOs.Admin;
using ELearning.Application.DTOs.Common;

namespace ELearning.Application.Interfaces;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserDto>> GetUsersAsync(string? search, int page, int pageSize, CancellationToken ct = default);
    Task<AdminUserDto> ChangeRolesAsync(Guid userId, ChangeUserRolesRequest request, CancellationToken ct = default);
    Task DeleteUserAsync(Guid userId, CancellationToken ct = default);
}