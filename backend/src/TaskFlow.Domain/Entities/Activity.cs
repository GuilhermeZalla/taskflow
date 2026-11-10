namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando um registro de atividade no sistema.
/// </summary>
public class Activity
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid UserId { get; set; }
    public string EntityType { get; set; } = string.Empty; // Workspace, Project, Task, Comment, Subtask
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Created, Updated, Completed, Assigned, etc.
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navegação para o workspace.
    /// </summary>
    public Workspace Workspace { get; set; } = null!;

    /// <summary>
    /// Navegação para o projeto (opcional).
    /// </summary>
    public Project? Project { get; set; }

    /// <summary>
    /// Navegação para a tarefa (opcional).
    /// </summary>
    public Task? Task { get; set; }

    /// <summary>
    /// Navegação para o usuário.
    /// </summary>
    public ApplicationUser User { get; set; } = null!;
}