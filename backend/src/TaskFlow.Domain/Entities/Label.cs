namespace TaskFlow.Domain.Entities;

public class Label
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#718a56";
    public DateTime CreatedAt { get; set; }
    public Workspace Workspace { get; set; } = null!;
    public ICollection<TaskLabel> Tasks { get; set; } = new List<TaskLabel>();
}
