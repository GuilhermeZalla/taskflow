using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Planning;

[ApiController]
[Authorize]
[Route("api")]
public sealed class ProjectTemplatesController(AppDbContext db) : ControllerBase
{
    [HttpGet("workspaces/{workspaceId:guid}/templates")]
    public async Task<IActionResult> List(Guid workspaceId, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var userId)) return Unauthorized();
        if (!await CanAccess(workspaceId, userId, ct)) return NotFound();
        var result = await db.ProjectTemplates.Where(x => x.WorkspaceId == workspaceId).Include(x => x.Tasks).OrderBy(x => x.Name).ToListAsync(ct);
        return Ok(result.Select(x => new { x.Id, x.WorkspaceId, x.Name, x.Description, taskCount = x.Tasks.Count }));
    }

    [HttpPost("workspaces/{workspaceId:guid}/templates")]
    public async Task<IActionResult> Create(Guid workspaceId, TemplateRequest request, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var userId)) return Unauthorized();
        if (!await CanManage(workspaceId, userId, ct)) return Forbid();
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120) return BadRequest(new ProblemDetails { Title = "Informe um nome de até 120 caracteres." });
        var project = await db.Projects.Include(x => x.Tasks).FirstOrDefaultAsync(x => x.Id == request.ProjectId && x.WorkspaceId == workspaceId, ct);
        if (project is null) return NotFound();
        var template = new ProjectTemplate { WorkspaceId = workspaceId, Name = name, Description = project.Description, CreatedById = userId, CreatedAt = DateTime.UtcNow,
            Tasks = project.Tasks.OrderBy(x => x.CreatedAt).Select((task, i) => new ProjectTemplateTask { Title = task.Title, Description = task.Description, Priority = task.Priority, Position = i }).ToList() };
        db.ProjectTemplates.Add(template); await db.SaveChangesAsync(ct);
        return Created($"/api/templates/{template.Id}", new { template.Id, template.Name, taskCount = template.Tasks.Count });
    }

    [HttpDelete("templates/{templateId:guid}")]
    public async Task<IActionResult> Delete(Guid templateId, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var userId)) return Unauthorized();
        var template = await db.ProjectTemplates.FirstOrDefaultAsync(x => x.Id == templateId, ct);
        if (template is null) return NotFound();
        if (!await CanManage(template.WorkspaceId, userId, ct)) return Forbid();
        db.ProjectTemplates.Remove(template); await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpPost("templates/{templateId:guid}/apply")]
    public async Task<IActionResult> Apply(Guid templateId, ApplyTemplateRequest request, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var userId)) return Unauthorized();
        var template = await db.ProjectTemplates.Include(x => x.Tasks).FirstOrDefaultAsync(x => x.Id == templateId, ct);
        if (template is null) return NotFound();
        if (!await CanManage(template.WorkspaceId, userId, ct)) return Forbid();
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 150) return BadRequest(new ProblemDetails { Title = "Informe um nome de projeto válido." });
        var project = new Project { WorkspaceId = template.WorkspaceId, Name = name, Description = request.Description ?? template.Description, Status = "Active", CreatedAt = DateTime.UtcNow };
        db.Projects.Add(project);
        var members = await db.WorkspaceMembers.Where(x => x.WorkspaceId == template.WorkspaceId).ToListAsync(ct);
        project.Members = members.Select(x => new ProjectMember { UserId = x.UserId, Role = x.Role }).Append(
            new ProjectMember { UserId = userId, Role = "Owner" }).DistinctBy(x => x.UserId).ToList();
        project.Tasks = template.Tasks.OrderBy(x => x.Position).Select(x => new Domain.Entities.Task { ProjectId = project.Id, Title = x.Title, Description = x.Description, Priority = x.Priority, Status = "ToDo", CreatedById = userId, CreatedAt = DateTime.UtcNow }).ToList();
        await db.SaveChangesAsync(ct);
        return Created($"/api/projects/{project.Id}", new { project.Id, project.WorkspaceId, project.Name, taskCount = project.Tasks.Count });
    }

    private Task<bool> CanAccess(Guid id, Guid user, CancellationToken ct) => db.Workspaces.AnyAsync(x => x.Id == id && (x.OwnerId == user || x.Members.Any(m => m.UserId == user)), ct);
    private Task<bool> CanManage(Guid id, Guid user, CancellationToken ct) => db.Workspaces.AnyAsync(x => x.Id == id && (x.OwnerId == user || x.Members.Any(m => m.UserId == user && (m.Role == "Owner" || m.Role == "Manager"))), ct);
    public sealed record TemplateRequest(string? Name, Guid ProjectId);
    public sealed record ApplyTemplateRequest(string? Name, string? Description);
}
