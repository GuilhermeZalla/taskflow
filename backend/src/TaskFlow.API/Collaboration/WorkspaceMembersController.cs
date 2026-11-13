using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.API.Email;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Collaboration;

[ApiController]
[Authorize]
[Route("api")]
public sealed class WorkspaceMembersController(
    AppDbContext context,
    UserManager<ApplicationUser> userManager,
    ActivityRecorder activityRecorder,
    ExternalNotificationEmailService notificationEmails) : ControllerBase
{
    [HttpGet("members")]
    public async Task<IActionResult> GetMembers([FromQuery] Guid? workspaceId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var accessibleWorkspaces = context.Workspaces.Where(workspace =>
            workspace.OwnerId == currentUserId || workspace.Members.Any(member => member.UserId == currentUserId));

        if (workspaceId.HasValue)
        {
            accessibleWorkspaces = accessibleWorkspaces.Where(workspace => workspace.Id == workspaceId.Value);
        }

        var memberships = await context.WorkspaceMembers
            .Where(member => accessibleWorkspaces.Any(workspace => workspace.Id == member.WorkspaceId))
            .OrderBy(member => member.Workspace.Name)
            .ThenBy(member => member.Role)
            .ToListAsync(cancellationToken);

        var userIds = memberships.Select(member => member.UserId.ToString()).ToArray();
        var userRecords = await context.Users
            .Where(user => userIds.Contains(user.Id))
            .ToListAsync(cancellationToken);
        var users = userRecords.ToDictionary(user => Guid.Parse(user.Id));

        var workspaceNames = await accessibleWorkspaces
            .ToDictionaryAsync(workspace => workspace.Id, workspace => workspace.Name, cancellationToken);

        var result = memberships
            .Where(member => users.ContainsKey(member.UserId))
            .Select(member => new WorkspaceMemberResponse(
                member.UserId,
                users[member.UserId].FullName,
                users[member.UserId].Email ?? string.Empty,
                member.Role,
                member.WorkspaceId,
                workspaceNames[member.WorkspaceId]));

        return Ok(result);
    }

    [HttpPost("workspaces/{workspaceId:guid}/members")]
    public async Task<IActionResult> AddMember(
        Guid workspaceId,
        [FromBody] AddWorkspaceMemberRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var workspace = await context.Workspaces
            .Include(item => item.Members)
            .FirstOrDefaultAsync(item => item.Id == workspaceId, cancellationToken);

        if (workspace is null)
        {
            return NotFound();
        }

        if (workspace.OwnerId != currentUserId &&
            !workspace.Members.Any(member => member.UserId == currentUserId && member.Role == "Manager"))
        {
            return Forbid();
        }

        var role = NormalizeRole(request.Role ?? string.Empty);
        if (role is null)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["role"] = ["Escolha membro, gerente ou observador."]
            }));
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new ProblemDetails { Title = "Informe o e-mail e o papel da pessoa." });
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || !Guid.TryParse(user.Id, out var invitedUserId))
        {
            return NotFound(new ProblemDetails
            {
                Title = "Conta não encontrada",
                Detail = "A pessoa precisa criar uma conta antes de ser adicionada."
            });
        }

        if (workspace.Members.Any(member => member.UserId == invitedUserId))
        {
            return Conflict(new ProblemDetails { Title = "A pessoa já faz parte deste espaço." });
        }

        var membership = new WorkspaceMember
        {
            WorkspaceId = workspaceId,
            UserId = invitedUserId,
            Role = role,
            JoinedAt = DateTime.UtcNow
        };
        context.WorkspaceMembers.Add(membership);

        var projectIds = await context.Projects
            .Where(project => project.WorkspaceId == workspaceId)
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);

        context.ProjectMembers.AddRange(projectIds.Select(projectId => new ProjectMember
        {
            ProjectId = projectId,
            UserId = invitedUserId,
            Role = role,
            JoinedAt = DateTime.UtcNow
        }));

        var notification = new Notification
        {
            UserId = invitedUserId,
            WorkspaceId = workspaceId,
            Title = "Você foi adicionado a um espaço de trabalho",
            Message = workspace.Name,
            Type = "workspace_member",
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.Add(notification);

        await context.SaveChangesAsync(cancellationToken);
        await notificationEmails.QueueAsync(notification, cancellationToken);
        await activityRecorder.RecordAsync(
            workspaceId, null, null, currentUserId, "members", invitedUserId.ToString(), user.FullName,
            "adicionado", cancellationToken);

        return Created($"/api/members?workspaceId={workspaceId}", new WorkspaceMemberResponse(
            invitedUserId, user.FullName, user.Email ?? string.Empty, role, workspaceId, workspace.Name));
    }

    [HttpDelete("workspaces/{workspaceId:guid}/members/{memberUserId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid workspaceId, Guid memberUserId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var workspace = await context.Workspaces.FirstOrDefaultAsync(item => item.Id == workspaceId, cancellationToken);
        if (workspace is null)
        {
            return NotFound();
        }

        var canManage = workspace.OwnerId == currentUserId || await context.WorkspaceMembers.AnyAsync(
            member => member.WorkspaceId == workspaceId && member.UserId == currentUserId && member.Role == "Manager",
            cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        if (memberUserId == workspace.OwnerId)
        {
            return BadRequest(new ProblemDetails { Title = "O proprietário não pode ser removido do próprio espaço." });
        }

        var membership = await context.WorkspaceMembers.FirstOrDefaultAsync(
            member => member.WorkspaceId == workspaceId && member.UserId == memberUserId,
            cancellationToken);
        if (membership is null)
        {
            return NotFound();
        }

        var user = await userManager.FindByIdAsync(memberUserId.ToString());
        var projectIds = await context.Projects
            .Where(project => project.WorkspaceId == workspaceId)
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);
        var projectMemberships = await context.ProjectMembers
            .Where(member => projectIds.Contains(member.ProjectId) && member.UserId == memberUserId)
            .ToListAsync(cancellationToken);
        var assignedTasks = await context.Tasks
            .Where(task => projectIds.Contains(task.ProjectId) && task.AssignedToId == memberUserId)
            .ToListAsync(cancellationToken);

        context.WorkspaceMembers.Remove(membership);
        context.ProjectMembers.RemoveRange(projectMemberships);
        foreach (var task in assignedTasks)
        {
            task.AssignedToId = null;
            task.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
        await activityRecorder.RecordAsync(
            workspaceId, null, null, currentUserId, "members", memberUserId.ToString(),
            user?.FullName ?? "Participante", "removido", cancellationToken);

        return NoContent();
    }

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out userId);
    }

    private static string? NormalizeRole(string role) => role.Trim().ToLowerInvariant() switch
    {
        "manager" or "gerente" or "responsável" => "Manager",
        "observer" or "observador" => "Observer",
        "member" or "membro" or "colaborador" => "Member",
        _ => null
    };

    public sealed record AddWorkspaceMemberRequest(string? Email, string? Role);

    public sealed record WorkspaceMemberResponse(
        Guid Id,
        string Name,
        string Email,
        string Role,
        Guid WorkspaceId,
        string WorkspaceName);
}
