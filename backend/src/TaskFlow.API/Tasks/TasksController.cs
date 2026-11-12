using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Commands.Tasks;
using TaskFlow.Application.DTOs;
using TaskFlow.API.Collaboration;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Tasks;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMediator _mediator;
    private readonly ActivityRecorder _activityRecorder;

    public TasksController(AppDbContext context, IMediator mediator, ActivityRecorder activityRecorder)
    {
        _context = context;
        _mediator = mediator;
        _activityRecorder = activityRecorder;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? projectId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = _context.Tasks
            .Where(t => t.Project.Members.Any(m => m.UserId == userId) || t.Project.Workspace.OwnerId == userId);

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        var tasks = await query
            .Select(t => new TaskDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                ProjectName = t.Project.Name,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                AssignedToId = t.AssignedToId,
                AssignedToName = _context.Users
                    .Where(user => user.Id == t.AssignedToId.ToString())
                    .Select(user => user.FullName)
                    .FirstOrDefault(),
                CreatedById = t.CreatedById,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                SubtaskCount = t.Subtasks.Count,
                CommentCount = t.Comments.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { detail = "O título da tarefa é obrigatório." });

        try
        {
            var project = await _context.Projects
                .Where(item => item.Id == dto.ProjectId)
                .Select(item => new { item.Id, item.WorkspaceId, item.Name })
                .FirstOrDefaultAsync(cancellationToken);
            if (project is null)
            {
                return NotFound(new { detail = "Projeto não encontrado." });
            }

            var result = await _mediator.Send(new CreateTaskCommand(dto, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                project.WorkspaceId, project.Id, result.Id, userId, "tasks", result.Id.ToString(),
                result.Title, "criado", cancellationToken);
            await NotifyAssigneeIfNeeded(dto.AssignedToId, userId, project.WorkspaceId, project.Id, result.Id, result.Title, cancellationToken);
            return Created($"/api/tasks/{result.Id}", result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { detail = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var task = await _context.Tasks
            .Where(t => t.Id == id && (t.Project.Members.Any(m => m.UserId == userId) || t.Project.Workspace.OwnerId == userId))
            .Select(t => new TaskDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                ProjectName = t.Project.Name,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                AssignedToId = t.AssignedToId,
                CreatedById = t.CreatedById,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                SubtaskCount = t.Subtasks.Count,
                CommentCount = t.Comments.Count
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (task == null) return NotFound();
        return Ok(task);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateTaskDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var existingTask = await _context.Tasks
                .Include(task => task.Project)
                .FirstOrDefaultAsync(task => task.Id == id, cancellationToken);
            if (existingTask is null)
            {
                return NotFound();
            }

            var previousStatus = existingTask.Status;
            var previousAssignee = existingTask.AssignedToId;
            var result = await _mediator.Send(new UpdateTaskCommand(id, dto.Title, dto.Description, dto.Status, dto.Priority, dto.AssignedToId, dto.DueDate, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                existingTask.Project.WorkspaceId, existingTask.ProjectId, id, userId, "tasks", id.ToString(),
                result.Title, previousStatus == result.Status ? "atualizado" : "status alterado", cancellationToken);
            if (previousAssignee != dto.AssignedToId)
            {
                await NotifyAssigneeIfNeeded(dto.AssignedToId, userId, existingTask.Project.WorkspaceId,
                    existingTask.ProjectId, id, result.Title, cancellationToken);
            }
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { detail = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var task = await _context.Tasks
                .Include(item => item.Project)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (task is null)
            {
                return NotFound();
            }

            var workspaceId = task.Project.WorkspaceId;
            var projectId = task.ProjectId;
            var taskTitle = task.Title;
            await _mediator.Send(new DeleteTaskCommand(id, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                workspaceId, null, null, userId, "tasks", id.ToString(), taskTitle,
                "excluído", cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    private Guid GetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(value, out var id) ? id : Guid.Empty;
    }

    private async System.Threading.Tasks.Task NotifyAssigneeIfNeeded(
        Guid? assigneeId,
        Guid actorId,
        Guid workspaceId,
        Guid projectId,
        Guid taskId,
        string taskTitle,
        CancellationToken cancellationToken)
    {
        if (!assigneeId.HasValue || assigneeId.Value == actorId)
        {
            return;
        }

        _context.Notifications.Add(new Notification
        {
            UserId = assigneeId.Value,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            TaskId = taskId,
            Title = "Uma tarefa foi atribuída a você",
            Message = taskTitle,
            Type = "assignment",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync(cancellationToken);
    }
}
