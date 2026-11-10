namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando um projeto dentro de um workspace.
/// </summary>
public class Project
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Active"; // Active, Completed, OnHold
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navegação para o workspace.
    /// </summary>
    public Workspace Workspace { get; set; } = null!;

    /// <summary>
    /// Navegação para membros do projeto.
    /// </summary>
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();

    /// <summary>
    /// Navegação para tarefas do projeto.
    /// </summary>
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
}