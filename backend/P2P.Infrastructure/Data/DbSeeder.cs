using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using P2P.Domain.Entities;
using P2P.Domain.Enums;

namespace P2P.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
    {
        await context.Database.MigrateAsync();

        // Seed roles
        string[] roles = ["Admin", "Approver", "Requester", "Finance", "SupplierAdmin", "SupplierUser"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Seed admin user
        if (!await userManager.Users.AnyAsync())
        {
            var admin = new User
            {
                UserName = "admin@p2p.com",
                Email = "admin@p2p.com",
                FullName = "System Administrator",
                Department = "IT",
                Role = UserRole.Admin,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@123456");
            if (result.Succeeded) await userManager.AddToRoleAsync(admin, "Admin");

            var approver = new User
            {
                UserName = "approver@p2p.com",
                Email = "approver@p2p.com",
                FullName = "John Approver",
                Department = "Finance",
                Role = UserRole.Approver,
                EmailConfirmed = true
            };
            var r2 = await userManager.CreateAsync(approver, "Approver@123456");
            if (r2.Succeeded) await userManager.AddToRoleAsync(approver, "Approver");

            var requester = new User
            {
                UserName = "requester@p2p.com",
                Email = "requester@p2p.com",
                FullName = "Jane Requester",
                Department = "Operations",
                Role = UserRole.Requester,
                EmailConfirmed = true
            };
            var r3 = await userManager.CreateAsync(requester, "Requester@123456");
            if (r3.Succeeded) await userManager.AddToRoleAsync(requester, "Requester");

            var finance = new User
            {
                UserName = "finance@p2p.com",
                Email = "finance@p2p.com",
                FullName = "Finance Manager",
                Department = "Finance",
                Role = UserRole.Finance,
                EmailConfirmed = true
            };
            var r4 = await userManager.CreateAsync(finance, "Finance@123456");
            if (r4.Succeeded) await userManager.AddToRoleAsync(finance, "Finance");
        }

        // Seed sample suppliers
        if (!await context.Suppliers.AnyAsync())
        {
            var supplier1 = new Supplier
            {
                Id = Guid.NewGuid().ToString(),
                SupplierCode = "S-0001",
                CompanyName = "Tech Supplies Ltd",
                ContactPerson = "Raj Kumar",
                Email = "raj@techsupplies.com",
                Phone = "+91-9876543210",
                Address = "123 Industrial Area",
                City = "Mumbai",
                State = "Maharashtra",
                Country = "India",
                PostalCode = "400001",
                GSTNumber = "27AABCT1332L1ZV",
                PANNumber = "AABCT1332L",
                IsApproved = true,
                IsActive = true,
                ApprovedAt = DateTime.UtcNow
            };

            var supplier2 = new Supplier
            {
                Id = Guid.NewGuid().ToString(),
                SupplierCode = "S-0002",
                CompanyName = "Global Office Solutions",
                ContactPerson = "Priya Sharma",
                Email = "priya@globaloffice.com",
                Phone = "+91-9876543211",
                Address = "456 Commercial Street",
                City = "Delhi",
                State = "Delhi",
                Country = "India",
                PostalCode = "110001",
                GSTNumber = "07AABCG1234L1ZV",
                PANNumber = "AABCG1234L",
                IsApproved = true,
                IsActive = true,
                ApprovedAt = DateTime.UtcNow
            };

            context.Suppliers.AddRange(supplier1, supplier2);
            await context.SaveChangesAsync();

            // Create supplier users
            var s1Admin = await userManager.FindByEmailAsync("raj@techsupplies.com");
            if (s1Admin == null)
            {
                s1Admin = new User
                {
                    UserName = "raj@techsupplies.com",
                    Email = "raj@techsupplies.com",
                    FullName = "Raj Kumar",
                    Role = UserRole.SupplierAdmin,
                    SupplierId = supplier1.Id,
                    EmailConfirmed = true
                };
                var sr = await userManager.CreateAsync(s1Admin, "Supplier@123456");
                if (sr.Succeeded) await userManager.AddToRoleAsync(s1Admin, "SupplierAdmin");
            }
        }
    }
}
