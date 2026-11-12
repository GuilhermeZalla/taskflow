using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Commands.Workspaces;
using TaskFlow.Application.DTOs;
using TaskFlow.API.Collaboration;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Workspaces;

[ApiController]
[Route("api/workspaces")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMediator _mediator;
    private readonly ActivityRecorder _activityRecorder;

    public WorkspacesController(AppDbContext context, IMediator mediator, ActivityRecorder activityRecorder)
    {
        _context = context;
        _mediator = mediator;
        _activityRecorder = activityRecorder;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var workspaces = await _context.Workspaces
            .Where(w => w.OwnerId == userId || w.Members.Any(wm => wm.UserId == userId))
            .Select(w => new WorkspaceDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                OwnerId = w.OwnerId,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                MemberCount = w.Members.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(workspaces);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkspaceDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { detail = "O nome do workspace é obrigatório." });

        var result = await _mediator.Send(new CreateWorkspaceCommand(dto, userId), cancellationToken);
        await _activityRecorder.RecordAsync(
            result.Id, null, null, userId, "workspaces", result.Id.ToString(), result.Name, "criado", cancellationToken);
        return Created($"/api/workspaces/{result.Id}", result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var workspace = await _context.Workspaces
            .Where(w => w.Id == id && (w.OwnerId == userId || w.Members.Any(wm => wm.UserId == userId)))
            .Select(w => new WorkspaceDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                OwnerId = w.OwnerId,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                MemberCount = w.Members.Count
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (workspace == null) return NotFound();
        return Ok(workspace);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateWorkspaceDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var result = await _mediator.Send(new UpdateWorkspaceCommand(id, dto.Name, dto.Description, userId), cancellationToken);
            await _activityRecorder.RecordAsync(
                id, null, null, userId, "workspaces", id.ToString(), result.Name, "atualizado", cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
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
            await _mediator.Send(new DeleteWorkspaceCommand(id, userId), cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
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
