namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando a associação de um usuário a um projeto.
/// </summary>
public class ProjectMember
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "Member";
    public DateTime JoinedAt { get; set; }

    public Project Project { get; set; } = null!;
}