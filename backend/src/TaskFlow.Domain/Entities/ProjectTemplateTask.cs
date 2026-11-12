namespace TaskFlow.Domain.Entities;

public class ProjectTemplateTask
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    public int Position { get; set; }
    public ProjectTemplate Template { get; set; } = null!;
}
