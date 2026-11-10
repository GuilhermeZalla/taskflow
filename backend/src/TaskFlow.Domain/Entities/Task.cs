namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando uma tarefa dentro de um projeto.
/// </summary>
public class Task
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "ToDo"; // ToDo, InProgress, Done, Cancelled
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
    public Guid? AssignedToId { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navegação para o projeto.
    /// </summary>
    public Project Project { get; set; } = null!;

    /// <summary>
    /// Navegação para o usuário atribuído.
    /// </summary>
    public ApplicationUser? AssignedTo { get; set; }

    /// <summary>
    /// Navegação para o criador da tarefa.
    /// </summary>
    public ApplicationUser CreatedBy { get; set; } = null!;

    /// <summary>
    /// Navegação para subtarefas.
    /// </summary>
    public ICollection<Subtask> Subtasks { get; set; } = new List<Subtask>();

    /// <summary>
    /// Navegação para comentários.
    /// </summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}