using ELearning.Application.DTOs.Admin;
using ELearning.Application.DTOs.Common;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ELearning.Domain.Enums;
namespace ELearning.Infrastructure.Services;

public class AdminUserService : IAdminUserService
{
    private const string ProtectedAdminEmail = "admin@elearning.local";

    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly ICurrentUserService _currentUser;

public async Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default)
{
    var usersByRole = await _db.UserRoles
        .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
        .GroupBy(name => name)
        .Select(g => new { Role = g.Key, Count = g.Count() })
        .ToListAsync(ct);

    int CountFor(string role) =>
        usersByRole.FirstOrDefault(x => x.Role == role)?.Count ?? 0;

    var totalUsers = await _db.Users.CountAsync(ct);
    var totalCourses = await _db.Courses.CountAsync(ct);
    var published = await _db.Courses.CountAsync(c => c.Status == CourseStatus.Published, ct);
    var drafts = totalCourses - published;
    var totalEnrollments = await _db.Enrollments.CountAsync(ct);
    var totalLessons = await _db.Lessons.CountAsync(ct);

    return new AdminStatsDto(
        totalUsers,
        CountFor("Admin"),
        CountFor("Instructor"),
        CountFor("Learner"),
        totalCourses,
        published,
        drafts,
        totalEnrollments,
        totalLessons);
}
    public AdminUserService(AppDbContext db, UserManager<AppUser> userManager, ICurrentUserService currentUser)
    {
        _db = db;
        _userManager = userManager;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(
        string? search, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Email!, pattern) ||
                EF.Functions.ILike(u.FullName, pattern));
        }

        var total = await query.CountAsync(ct);

        var users = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        // Load roles for each user (N+1 but N is at most pageSize; fine for MVP)
        var dtos = new List<AdminUserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            dtos.Add(Map(user, roles));
        }

        return new PagedResult<AdminUserDto>(dtos, total, page, pageSize);
    }

    public async Task<AdminUserDto> ChangeRolesAsync(Guid userId, ChangeUserRolesRequest request, CancellationToken ct = default)
    {
        var target = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new KeyNotFoundException("User not found.");

        if (string.Equals(target.Email, ProtectedAdminEmail, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The seeded admin account cannot be modified.");

        if (target.Id == _currentUser.UserId)
            throw new InvalidOperationException("You cannot change your own roles.");

        // Validate: roles must be non-empty and all known
        if (request.Roles.Count == 0)
            throw new InvalidOperationException("At least one role is required.");

        var validRoles = new[] { "Admin", "Instructor", "Learner" };
        var invalid = request.Roles.Where(r => !validRoles.Contains(r)).ToList();
        if (invalid.Count > 0)
            throw new InvalidOperationException($"Unknown role(s): {string.Join(", ", invalid)}");

        // Apply: remove all current roles, add requested
        var current = await _userManager.GetRolesAsync(target);
        if (current.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(target, current);
            if (!removeResult.Succeeded)
                throw new InvalidOperationException(string.Join("; ", removeResult.Errors.Select(e => e.Description)));
        }

        var addResult = await _userManager.AddToRolesAsync(target, request.Roles);
        if (!addResult.Succeeded)
            throw new InvalidOperationException(string.Join("; ", addResult.Errors.Select(e => e.Description)));

        var roles = await _userManager.GetRolesAsync(target);
        return Map(target, roles);
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken ct = default)
    {
        var target = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new KeyNotFoundException("User not found.");

        if (string.Equals(target.Email, ProtectedAdminEmail, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The seeded admin account cannot be deleted.");

        if (target.Id == _currentUser.UserId)
            throw new InvalidOperationException("You cannot delete your own account.");

        // Guard: refuse deletion if user still owns courses.
        var ownsCourses = await _db.Courses.AnyAsync(c => c.InstructorId == userId, ct);
        if (ownsCourses)
            throw new InvalidOperationException("Cannot delete a user who still owns courses. Reassign or delete their courses first.");

        var result = await _userManager.DeleteAsync(target);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));
    }

    private static AdminUserDto Map(AppUser u, IEnumerable<string> roles) => new(
        u.Id, u.Email ?? "", u.FullName, u.Bio, u.AvatarUrl, roles, u.CreatedAt);
}