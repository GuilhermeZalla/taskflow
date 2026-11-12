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

    public Task Task { get; set; } = null!;
    public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
}
