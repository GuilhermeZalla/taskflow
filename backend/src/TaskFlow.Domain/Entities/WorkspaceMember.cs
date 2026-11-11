namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando a associação de um usuário a um workspace.
/// </summary>
public class WorkspaceMember
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "Member";
    public DateTime JoinedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
}