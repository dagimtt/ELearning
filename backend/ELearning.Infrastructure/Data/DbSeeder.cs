using ELearning.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace ELearning.Infrastructure.Data;

public static class DbSeeder
{
    public static readonly string[] Roles = { "Admin", "Instructor", "Learner" };

    public static async Task SeedAsync(IServiceProvider sp)
    {
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = sp.GetRequiredService<UserManager<AppUser>>();
        var db = sp.GetRequiredService<AppDbContext>();

        foreach (var role in Roles)
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));

        const string adminEmail = "admin@elearning.local";
        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Platform Admin",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin123!");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Admin");
        }

        if (!db.Categories.Any())
        {
            db.Categories.AddRange(
                new Category { Name = "Programming", Slug = "programming" },
                new Category { Name = "Design", Slug = "design" },
                new Category { Name = "Business", Slug = "business" });
            await db.SaveChangesAsync();
        }
    }
}