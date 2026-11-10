namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando uma subtarefa dentro de uma tarefa.
/// </summary>
public class Subtask
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Navegação para a tarefa mãe.
    /// </summary>
    public Task Task { get; set; } = null!;
}