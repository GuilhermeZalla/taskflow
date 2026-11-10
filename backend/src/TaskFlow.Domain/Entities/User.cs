namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando um usuário do sistema.
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}