namespace TaskFlow.Domain.Entities;

/// <summary>
/// Entidade de domínio representando um comentário em uma tarefa.
/// </summary>
public class Comment
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navegação para a tarefa.
    /// </summary>
    public Task Task { get; set; } = null!;

    /// <summary>
    /// Navegação para o usuário.
    /// </summary>
    public ApplicationUser User { get; set; } = null!;
}