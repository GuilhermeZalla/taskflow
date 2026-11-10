using Microsoft.AspNetCore.Identity;

namespace TaskFlow.Infrastructure.Persistence;

/// <summary>
/// Implementação do usuário de identidade do ASP.NET Core Identity.
/// Mapeia para a entidade de domínio User.
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}