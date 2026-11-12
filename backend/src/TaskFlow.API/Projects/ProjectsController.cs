using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Commands.Projects;
using TaskFlow.Application.DTOs;
using TaskFlow.API.Collaboration;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Projects;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMediator _mediator;
    private readonly ActivityRecorder _activityRecorder;

    public ProjectsController(AppDbContext context, IMediator mediator, ActivityRecorder activityRecorder)
    {
        _context = context;
        _mediator = mediator;
        _activityRecorder = activityRecorder;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? workspaceId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = _context.Projects
            .Where(p => p.Members.Any(m => m.UserId == userId) || p.Workspace.OwnerId == userId);

        if (workspaceId.HasValue)
            query = query.Where(p => p.WorkspaceId == workspaceId.Value);

        var projects = await query
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                WorkspaceId = p.WorkspaceId,
                WorkspaceName = p.Workspace.Name,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                DueDate = p.DueDate,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                MemberCount = p.Members.Count,
                TaskCount = p.Tasks.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(projects);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { detail = "O nome do projeto é obrigatório." });

        try
        {
            var result = await _mediator.Send(new CreateProjectCommand(dto, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                result.WorkspaceId, result.Id, null, userId, "projects", result.Id.ToString(), result.Name,
                "criado", cancellationToken);
            return Created($"/api/projects/{result.Id}", result);
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

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var project = await _context.Projects
            .Where(p => p.Id == id && (p.Members.Any(m => m.UserId == userId) || p.Workspace.OwnerId == userId))
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                WorkspaceId = p.WorkspaceId,
                WorkspaceName = p.Workspace.Name,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                DueDate = p.DueDate,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                MemberCount = p.Members.Count,
                TaskCount = p.Tasks.Count
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateProjectDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var result = await _mediator.Send(new UpdateProjectCommand(id, dto.Name, dto.Description, dto.Status, dto.StartDate, dto.DueDate, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                result.WorkspaceId, id, null, userId, "projects", id.ToString(), result.Name,
                "atualizado", cancellationToken);
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
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var project = await _context.Projects
                .Where(item => item.Id == id)
                .Select(item => new { item.WorkspaceId, item.Name })
                .FirstOrDefaultAsync(cancellationToken);
            if (project is null)
            {
                return NotFound();
            }

            await _mediator.Send(new DeleteProjectCommand(id, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                project.WorkspaceId, null, null, userId, "projects", id.ToString(), project.Name,
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
}
