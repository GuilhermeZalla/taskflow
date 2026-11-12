using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Collaboration;

public sealed class ActivityRecorder(AppDbContext context)
{
    public async System.Threading.Tasks.Task RecordAsync(
        Guid workspaceId,
        Guid? projectId,
        Guid? taskId,
        Guid userId,
        string entityType,
        string entityId,
        string entityName,
        string action,
        CancellationToken cancellationToken)
    {
        context.Activities.Add(new Activity
        {
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            TaskId = taskId,
            UserId = userId,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            Action = action,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync(cancellationToken);
    }
}
