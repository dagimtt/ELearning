using ELearning.Application.DTOs.Admin;
using ELearning.Application.DTOs.Common;
using ELearning.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminUserService _users;
    public AdminController(IAdminUserService users) => _users = users;

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _users.GetUsersAsync(search, page, pageSize, ct));

    [HttpPut("users/{id:guid}/roles")]
    public async Task<ActionResult<AdminUserDto>> ChangeRoles(
        Guid id, ChangeUserRolesRequest request, CancellationToken ct)
        => Ok(await _users.ChangeRolesAsync(id, request, ct));

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await _users.DeleteUserAsync(id, ct);
        return NoContent();
    }
}