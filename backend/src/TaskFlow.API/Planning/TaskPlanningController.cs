using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Planning;

[ApiController]
[Authorize]
[Route("api")]
public sealed class TaskPlanningController(AppDbContext context) : ControllerBase
{
    [HttpGet("workspaces/{workspaceId:guid}/labels")]
    public async Task<IActionResult> GetLabels(Guid workspaceId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        if (!await CanAccessWorkspace(workspaceId, userId, cancellationToken)) return NotFound();

        var labels = await context.Labels
            .Where(label => label.WorkspaceId == workspaceId)
            .OrderBy(label => label.Name)
            .Select(label => new { label.Id, label.WorkspaceId, label.Name, label.Color })
            .ToListAsync(cancellationToken);
        return Ok(labels);
    }

    [HttpPost("workspaces/{workspaceId:guid}/labels")]
    public async Task<IActionResult> CreateLabel(
        Guid workspaceId,
        [FromBody] LabelRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        if (!await CanManageWorkspace(workspaceId, userId, cancellationToken)) return Forbid();

        var name = request.Name?.Trim();
        var color = request.Color?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 50)
        {
            return BadRequest(new ProblemDetails { Title = "A etiqueta deve ter entre 1 e 50 caracteres." });
        }

        if (string.IsNullOrWhiteSpace(color) || !Regex.IsMatch(color, "^#[0-9A-Fa-f]{6}$"))
        {
            return BadRequest(new ProblemDetails { Title = "Informe uma cor hexadecimal no formato #RRGGBB." });
        }

        if (await context.Labels.AnyAsync(label => label.WorkspaceId == workspaceId && label.Name == name, cancellationToken))
        {
            return Conflict(new ProblemDetails { Title = "Já existe uma etiqueta com esse nome neste espaço." });
        }

        var label = new Label
        {
            WorkspaceId = workspaceId,
            Name = name,
            Color = color.ToUpperInvariant(),
            CreatedAt = DateTime.UtcNow
        };
        context.Labels.Add(label);
        await context.SaveChangesAsync(cancellationToken);
        return Created($"/api/labels/{label.Id}", new { label.Id, label.WorkspaceId, label.Name, label.Color });
    }

    [HttpDelete("labels/{labelId:guid}")]
    public async Task<IActionResult> DeleteLabel(Guid labelId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var label = await context.Labels.FindAsync([labelId], cancellationToken);
        if (label is null) return NotFound();
        if (!await CanManageWorkspace(label.WorkspaceId, userId, cancellationToken)) return Forbid();

        context.Labels.Remove(label);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("tasks/{taskId:guid}/labels")]
    public async Task<IActionResult> GetTaskLabels(Guid taskId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        if (task is null) return NotFound();

        var labels = await context.TaskLabels
            .Where(link => link.TaskId == taskId)
            .Select(link => new { link.Label.Id, link.Label.Name, link.Label.Color, link.Label.WorkspaceId })
            .OrderBy(label => label.Name)
            .ToListAsync(cancellationToken);
        return Ok(labels);
    }

    [HttpPut("tasks/{taskId:guid}/labels")]
    public async Task<IActionResult> SetTaskLabels(
        Guid taskId,
        [FromBody] SetTaskLabelsRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        if (task is null) return NotFound();

        if (!await IsProjectMember(task.ProjectId, userId, cancellationToken)) return Forbid();
        var labelIds = (request.LabelIds ?? []).Distinct().ToArray();
        var validCount = await context.Labels.CountAsync(
            label => label.WorkspaceId == task.Project.WorkspaceId && labelIds.Contains(label.Id), cancellationToken);
        if (validCount != labelIds.Length)
        {
            return BadRequest(new ProblemDetails { Title = "Todas as etiquetas precisam pertencer ao mesmo espaço da tarefa." });
        }

        var current = await context.TaskLabels.Where(link => link.TaskId == taskId).ToListAsync(cancellationToken);
        context.TaskLabels.RemoveRange(current);
        context.TaskLabels.AddRange(labelIds.Select(labelId => new TaskLabel { TaskId = taskId, LabelId = labelId }));
        task.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("tasks/{taskId:guid}/dependencies")]
    public async Task<IActionResult> GetDependencies(Guid taskId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        if (task is null) return NotFound();

        var dependencies = await context.TaskDependencies
            .Where(dependency => dependency.TaskId == taskId)
            .Select(dependency => new
            {
                dependency.DependsOnTaskId,
                dependency.DependsOnTask.Title,
                dependency.DependsOnTask.Status,
                dependency.DependsOnTask.DueDate,
                dependency.CreatedAt
            })
            .OrderBy(dependency => dependency.Title)
            .ToListAsync(cancellationToken);
        return Ok(dependencies);
    }

    [HttpPost("tasks/{taskId:guid}/dependencies")]
    public async Task<IActionResult> AddDependency(
        Guid taskId,
        [FromBody] AddTaskDependencyRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        var prerequisite = await GetAccessibleTask(request.DependsOnTaskId, userId, cancellationToken);
        if (task is null || prerequisite is null) return NotFound();
        if (!await IsProjectMember(task.ProjectId, userId, cancellationToken) ||
            !await IsProjectMember(prerequisite.ProjectId, userId, cancellationToken)) return Forbid();
        if (taskId == request.DependsOnTaskId) return BadRequest(new ProblemDetails { Title = "Uma tarefa não pode depender de si mesma." });
        if (task.Project.WorkspaceId != prerequisite.Project.WorkspaceId)
            return BadRequest(new ProblemDetails { Title = "As tarefas precisam pertencer ao mesmo espaço." });
        if (await context.TaskDependencies.AnyAsync(dependency =>
            dependency.TaskId == taskId && dependency.DependsOnTaskId == request.DependsOnTaskId, cancellationToken))
            return Conflict(new ProblemDetails { Title = "Essa dependência já existe." });
        if (await WouldCreateCycle(taskId, request.DependsOnTaskId, cancellationToken))
            return Conflict(new ProblemDetails { Title = "Essa dependência criaria um ciclo." });

        context.TaskDependencies.Add(new TaskDependency
        {
            TaskId = taskId,
            DependsOnTaskId = request.DependsOnTaskId,
            CreatedAt = DateTime.UtcNow
        });
        task.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Created($"/api/tasks/{taskId}/dependencies/{request.DependsOnTaskId}", new { taskId, request.DependsOnTaskId });
    }

    [HttpDelete("tasks/{taskId:guid}/dependencies/{dependsOnTaskId:guid}")]
    public async Task<IActionResult> RemoveDependency(Guid taskId, Guid dependsOnTaskId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        if (task is null) return NotFound();
        if (!await IsProjectMember(task.ProjectId, userId, cancellationToken)) return Forbid();

        var dependency = await context.TaskDependencies.FirstOrDefaultAsync(
            item => item.TaskId == taskId && item.DependsOnTaskId == dependsOnTaskId, cancellationToken);
        if (dependency is null) return NotFound();
        context.TaskDependencies.Remove(dependency);
        task.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<bool> WouldCreateCycle(Guid taskId, Guid prerequisiteId, CancellationToken cancellationToken)
    {
        var visited = new HashSet<Guid>();
        var pending = new Queue<Guid>();
        pending.Enqueue(prerequisiteId);

        while (pending.TryDequeue(out var currentId))
        {
            if (currentId == taskId) return true;
            if (!visited.Add(currentId)) continue;

            var next = await context.TaskDependencies
                .Where(dependency => dependency.TaskId == currentId)
                .Select(dependency => dependency.DependsOnTaskId)
                .ToListAsync(cancellationToken);
            foreach (var dependencyId in next) pending.Enqueue(dependencyId);
        }

        return false;
    }

    private Task<Domain.Entities.Task?> GetAccessibleTask(Guid taskId, Guid userId, CancellationToken cancellationToken)
    {
        return context.Tasks
            .Include(task => task.Project)
            .ThenInclude(project => project.Workspace)
            .Where(task => task.Id == taskId)
            .Where(task => task.Project.Workspace.OwnerId == userId ||
                task.Project.Workspace.Members.Any(member => member.UserId == userId))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private Task<bool> CanAccessWorkspace(Guid workspaceId, Guid userId, CancellationToken cancellationToken)
    {
        return context.Workspaces.AnyAsync(workspace => workspace.Id == workspaceId &&
            (workspace.OwnerId == userId || workspace.Members.Any(member => member.UserId == userId)), cancellationToken);
    }

    private Task<bool> CanManageWorkspace(Guid workspaceId, Guid userId, CancellationToken cancellationToken)
    {
        return context.Workspaces.AnyAsync(workspace => workspace.Id == workspaceId &&
            (workspace.OwnerId == userId || workspace.Members.Any(member =>
                member.UserId == userId && (member.Role == "Owner" || member.Role == "Manager"))), cancellationToken);
    }

    private Task<bool> IsProjectMember(Guid projectId, Guid userId, CancellationToken cancellationToken)
    {
        return context.ProjectMembers.AnyAsync(member =>
            member.ProjectId == projectId && member.UserId == userId && member.Role != "Observer", cancellationToken);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out userId);
    }

    public sealed record LabelRequest(string? Name, string? Color);
    public sealed record SetTaskLabelsRequest(Guid[]? LabelIds);
    public sealed record AddTaskDependencyRequest(Guid DependsOnTaskId);
}
