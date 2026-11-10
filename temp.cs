using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TaskFlow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add controllers com Problem Details
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

builder.Services.AddProblemDetails();

// Entity Framework Core + PostgreSQL
builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString(\"DefaultConnection\");
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
    });
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
})
.AddEntityFrameworkStores<AppDbContext>();

// Autenticação JWT Bearer
var jwtSettings = builder.Configuration.GetSection(\"JwtSettings\");
var secretKey = jwtSettings[\"SecretKey\"] ?? throw new InvalidOperationException(\"JWT SecretKey não configurada.\");
var issuer = jwtSettings[\"Issuer\"] ?? \"TaskFlow\";
var audience = jwtSettings[\"Audience\"] ?? \"TaskFlow\";
var keyBytes = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS para o servidor de desenvolvimento do React
builder.Services.AddCors(options =>
{
    options.AddPolicy(\"AllowFrontend\", policy =>
    {
        policy.WithOrigins(\"http://localhost:5173\")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Swagger / OpenAPI
builder.Services.AddOpenApi();

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(\"postgres\", tags: new[] { \"db\" });

var app = builder.Build();

// Tratamento centralizado de exceções (Problem Details)
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(\"AllowFrontend\");

app.UseAuthentication();
app.UseAuthorization();

// Endpoint de saúde
app.MapGet(\"/api/health\", () => Results.Ok(new { status = \"healthy\", timestamp = DateTime.UtcNow }))
    .WithName(\"GetHealth\")
    .WithTags(\"Health\");

app.MapHealthChecks(\"/api/health/db\", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains(\"db\"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = \"application/json\";
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

app.MapControllers();

// Convenção de rotas: /api/{resource}
app.MapGet(\"/api\", () => Results.Ok(new { message = \"TaskFlow API\", version = \"1.0.0\" }));

app.Run();
