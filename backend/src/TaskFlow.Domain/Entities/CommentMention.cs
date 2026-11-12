namespace TaskFlow.Domain.Entities;

public class CommentMention
{
    public Guid Id { get; set; }
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public Comment Comment { get; set; } = null!;
}
