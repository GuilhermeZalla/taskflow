namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando a associação de um usuário a um workspace.
/// </summary>
public class WorkspaceMember
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "Member"; // Owner, Member, Admin
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// Navegação para o workspace.
    /// </summary>
    public Workspace Workspace { get; set; } = null!;

    /// <summary>
    /// Navegação para o usuário.
    /// </summary>
    public ApplicationUser User { get; set; } = null!;
}