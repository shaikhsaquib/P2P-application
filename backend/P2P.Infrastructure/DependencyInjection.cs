using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using P2P.Application.Interfaces;
using P2P.Domain.Interfaces;
using P2P.Infrastructure.Data;
using P2P.Infrastructure.Repositories;
using P2P.Infrastructure.Services;

namespace P2P.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? "Data Source=p2p.db";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (connectionString.Contains(".db") || connectionString.StartsWith("Data Source="))
                options.UseSqlite(connectionString);
            else
                options.UseSqlServer(connectionString);
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<ICurrentUser, CurrentUserService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IBlobService, BlobService>();
        services.AddScoped<INumberGenerator, NumberGeneratorService>();
        services.AddScoped<ThreeWayMatchService>();

        return services;
    }
}
