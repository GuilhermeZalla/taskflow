namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando um workspace/ambiente de colaboração.
/// </summary>
public class Workspace
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public ApplicationUser? Owner { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navegação para membros do workspace.
    /// </summary>
    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
}