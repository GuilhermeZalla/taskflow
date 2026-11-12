using System.Security.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.IO;
using TaskFlow.API.Collaboration;
using TaskFlow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add controllers com Problem Details
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

builder.Services.AddProblemDetails();

// Entity Framework Core + MySQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured.");
    }

    options.UseMySQL(connectionString);
});

// ASP.NET Core Identity
builder.Services.AddIdentityApiEndpoints<ApplicationUser>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
})
    .AddEntityFrameworkStores<AppDbContext>();

var dataProtectionPath = builder.Configuration["DataProtection:KeyPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionPath))
{
    Directory.CreateDirectory(dataProtectionPath);
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath));
}

builder.Services.AddAuthorization();
builder.Services.AddScoped<ActivityRecorder>();
builder.Services.AddHostedService<TaskReminderService>();

// CORS para o servidor de desenvolvimento do React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Swagger / OpenAPI
builder.Services.AddOpenApi();

// MediatR - registra handlers da API e commands da Application
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
    cfg.RegisterServicesFromAssembly(typeof(TaskFlow.Application.Commands.Workspaces.CreateWorkspaceCommand).Assembly);
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("mysql", tags: new[] { "db" });

var app = builder.Build();

// Tratamento centralizado de exceções (Problem Details)
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Endpoint de saúde
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("GetHealth")
   .WithTags("Health");

app.MapHealthChecks("/api/health/db", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description
            })
        });
        await context.Response.WriteAsync(result);
    }
});

// Mapeamento de endpoints de Identity (registro, login, etc.)
app.MapIdentityApi<ApplicationUser>();

app.MapPost("/api/auth/register", async (
    [FromBody] RegisterRequest request,
    UserManager<ApplicationUser> userManager,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 200)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["fullName"] = ["Informe seu nome, com até 200 caracteres."]
        });
    }

    if (string.IsNullOrWhiteSpace(request.Email) || !new EmailAddressAttribute().IsValid(request.Email))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
        ["email"] = ["Informe um e-mail válido."]
        });
    }

    if (string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["password"] = ["A senha é obrigatória."]
        });
    }

    var user = new ApplicationUser
    {
        UserName = request.Email.Trim(),
        Email = request.Email.Trim(),
        FullName = request.FullName.Trim(),
        CreatedAt = DateTime.UtcNow
    };

    var result = await userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
    {
        return Results.ValidationProblem(result.Errors
            .GroupBy(error => error.Code)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray()));
    }

    return Results.Created("/api/auth/me", new { user.Id, user.Email, user.FullName });
})
.AllowAnonymous()
.WithName("RegisterTaskFlowUser");

app.MapControllers();

// Convenção de rotas: /api/{resource}
app.MapGet("/api", () => Results.Ok(new { message = "TaskFlow API", version = "1.0.0" }));

// Endpoint para obter informações do usuário autenticado
app.MapGet("/api/auth/me", async (
    ClaimsPrincipal user,
    UserManager<ApplicationUser> userManager) =>
{
    if (user.Identity?.IsAuthenticated != true)
        return Results.Unauthorized();

    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? user.FindFirst("sub")?.Value;
    var account = userId is null ? null : await userManager.FindByIdAsync(userId);

    if (account is null || !Guid.TryParse(account.Id, out var parsedUserId))
        return Results.Unauthorized();

    return Results.Ok(new
    {
        UserId = parsedUserId,
        Email = account.Email,
        FullName = account.FullName
    });
}).RequireAuthorization();

app.Run();

public sealed record RegisterRequest(string? FullName, string? Email, string? Password);

public partial class Program { }
