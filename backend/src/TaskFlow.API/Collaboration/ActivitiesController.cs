using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Collaboration;

[ApiController]
[Authorize]
[Route("api/activities")]
public sealed class ActivitiesController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActivities(
        [FromQuery] Guid? workspaceId,
        [FromQuery] string? entityType,
        [FromQuery] DateTime? since,
        CancellationToken cancellationToken)
    {
        var currentUser = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(currentUser, out var currentUserId))
        {
            return Unauthorized();
        }

        var query = context.Activities.Where(activity =>
            activity.Workspace.OwnerId == currentUserId ||
            activity.Workspace.Members.Any(member => member.UserId == currentUserId));

        if (workspaceId.HasValue)
        {
            query = query.Where(activity => activity.WorkspaceId == workspaceId.Value);
        }

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(activity => activity.EntityType == entityType);
        }

        if (since.HasValue)
        {
            query = query.Where(activity => activity.CreatedAt >= since.Value.ToUniversalTime());
        }

        var activities = await query
            .OrderByDescending(activity => activity.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);
        var actorIds = activities.Select(activity => activity.UserId.ToString()).Distinct().ToArray();
        var actors = await context.Users
            .Where(user => actorIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        return Ok(activities.Select(activity => new
        {
            id = activity.Id,
            workspaceId = activity.WorkspaceId,
            projectId = activity.ProjectId,
            taskId = activity.TaskId,
            resource = activity.EntityType,
            entityId = activity.EntityId,
            title = activity.EntityName,
            action = activity.Action,
            actorName = actors.GetValueOrDefault(activity.UserId.ToString())?.FullName ?? "TaskFlow user",
            createdAt = activity.CreatedAt
        }));
    }
}
