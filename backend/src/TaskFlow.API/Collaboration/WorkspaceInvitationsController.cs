using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Email;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Collaboration;

[ApiController]
[Authorize]
[Route("api")]
public sealed class WorkspaceInvitationsController(
    AppDbContext context,
    UserManager<ApplicationUser> userManager,
    IEmailOutboxQueue emailOutbox,
    EmailTemplateFactory emailTemplates,
    ExternalNotificationEmailService notificationEmails,
    ActivityRecorder activityRecorder) : ControllerBase
{
    private static readonly TimeSpan InvitationLifetime = TimeSpan.FromDays(7);

    [HttpGet("workspaces/{workspaceId:guid}/invitations")]
    public async Task<IActionResult> GetPending(Guid workspaceId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId)) return Unauthorized();
        var workspace = await GetWorkspace(workspaceId, currentUserId, cancellationToken);
        if (workspace is null) return NotFound();
        if (!CanManage(workspace, currentUserId)) return Forbid();

        var now = DateTime.UtcNow;
        var invitations = await context.WorkspaceInvitations
            .Where(invitation => invitation.WorkspaceId == workspaceId &&
                invitation.AcceptedAt == null && invitation.RevokedAt == null && invitation.ExpiresAt > now)
            .OrderByDescending(invitation => invitation.CreatedAt)
            .Select(invitation => new InvitationResponse(invitation.Id, invitation.Email, invitation.Role,
                invitation.CreatedAt, invitation.ExpiresAt))
            .ToListAsync(cancellationToken);
        return Ok(invitations);
    }

    [HttpPost("workspaces/{workspaceId:guid}/invitations")]
    public async Task<IActionResult> SendInvitation(
        Guid workspaceId,
        [FromBody] CreateInvitationRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId)) return Unauthorized();
        var workspace = await GetWorkspace(workspaceId, currentUserId, cancellationToken);
        if (workspace is null) return NotFound();
        if (!CanManage(workspace, currentUserId)) return Forbid();

        var email = request.Email?.Trim() ?? string.Empty;
        if (email.Length > 320 || !new EmailAddressAttribute().IsValid(email))
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["email"] = ["Informe um e-mail válido."]
            }));
        }

        var role = NormalizeRole(request.Role ?? string.Empty);
        if (role is null)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["role"] = ["Escolha membro, gerente ou observador."]
            }));
        }

        var normalizedEmail = userManager.NormalizeEmail(email) ?? email.ToUpperInvariant();
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser is not null && Guid.TryParse(existingUser.Id, out var existingUserId) &&
            (existingUserId == workspace.OwnerId || await context.WorkspaceMembers.AnyAsync(
                member => member.WorkspaceId == workspaceId && member.UserId == existingUserId,
                cancellationToken)))
        {
            return Conflict(new ProblemDetails { Title = "A pessoa já faz parte deste espaço." });
        }

        var now = DateTime.UtcNow;
        var invitation = await context.WorkspaceInvitations.FirstOrDefaultAsync(item =>
            item.WorkspaceId == workspaceId && item.NormalizedEmail == normalizedEmail &&
            item.AcceptedAt == null && item.RevokedAt == null && item.ExpiresAt > now,
            cancellationToken);
        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        if (invitation is null)
        {
            invitation = new WorkspaceInvitation
            {
                WorkspaceId = workspaceId,
                InvitedByUserId = currentUserId,
                Email = email,
                NormalizedEmail = normalizedEmail,
                Role = role,
                TokenHash = HashToken(token),
                CreatedAt = now,
                ExpiresAt = now.Add(InvitationLifetime)
            };
            context.WorkspaceInvitations.Add(invitation);
        }
        else
        {
            invitation.InvitedByUserId = currentUserId;
            invitation.Email = email;
            invitation.Role = role;
            invitation.TokenHash = HashToken(token);
            invitation.CreatedAt = now;
            invitation.ExpiresAt = now.Add(InvitationLifetime);
        }

        await context.SaveChangesAsync(cancellationToken);
        var inviter = await userManager.FindByIdAsync(currentUserId.ToString());
        var link = emailTemplates.BuildFrontendLink("accept-invitation", new Dictionary<string, string>
        {
            ["token"] = token
        });
        await emailOutbox.EnqueueAsync(
            emailTemplates.Invitation(email, workspace.Name, inviter?.FullName ?? "TaskFlow", role, link),
            cancellationToken);

        return Accepted(new InvitationResponse(invitation.Id, invitation.Email, invitation.Role,
            invitation.CreatedAt, invitation.ExpiresAt));
    }

    [HttpDelete("workspaces/{workspaceId:guid}/invitations/{invitationId:guid}")]
    public async Task<IActionResult> RevokeInvitation(
        Guid workspaceId,
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId)) return Unauthorized();
        var workspace = await GetWorkspace(workspaceId, currentUserId, cancellationToken);
        if (workspace is null) return NotFound();
        if (!CanManage(workspace, currentUserId)) return Forbid();

        var invitation = await context.WorkspaceInvitations.FirstOrDefaultAsync(item =>
            item.Id == invitationId && item.WorkspaceId == workspaceId &&
            item.AcceptedAt == null && item.RevokedAt == null,
            cancellationToken);
        if (invitation is null) return NotFound();

        invitation.RevokedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("invitations/accept")]
    public async Task<IActionResult> AcceptInvitation(
        [FromBody] AcceptInvitationRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var currentUserId)) return Unauthorized();
        var account = await userManager.FindByIdAsync(currentUserId.ToString());
        if (account is null || !account.EmailConfirmed || string.IsNullOrWhiteSpace(account.Email)) return Forbid();

        var token = request.Token?.Trim() ?? string.Empty;
        if (token.Length is 0 or > 256)
            return BadRequest(new ProblemDetails { Title = "O convite é inválido ou expirou." });

        var now = DateTime.UtcNow;
        var invitation = await context.WorkspaceInvitations.FirstOrDefaultAsync(
            item => item.TokenHash == HashToken(token), cancellationToken);
        if (invitation is null || invitation.AcceptedAt.HasValue || invitation.RevokedAt.HasValue ||
            invitation.ExpiresAt <= now)
        {
            return BadRequest(new ProblemDetails { Title = "O convite é inválido ou expirou." });
        }

        var normalizedEmail = userManager.NormalizeEmail(account.Email) ?? account.Email.ToUpperInvariant();
        if (!string.Equals(normalizedEmail, invitation.NormalizedEmail, StringComparison.Ordinal)) return Forbid();

        var workspace = await context.Workspaces.FirstOrDefaultAsync(
            item => item.Id == invitation.WorkspaceId, cancellationToken);
        if (workspace is null) return NotFound();
        if (workspace.OwnerId == currentUserId || await context.WorkspaceMembers.AnyAsync(
            member => member.WorkspaceId == workspace.Id && member.UserId == currentUserId,
            cancellationToken))
        {
            return Conflict(new ProblemDetails { Title = "Sua conta já faz parte deste espaço." });
        }

        context.WorkspaceMembers.Add(new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = currentUserId,
            Role = invitation.Role,
            JoinedAt = now
        });

        var projectIds = await context.Projects
            .Where(project => project.WorkspaceId == workspace.Id)
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);
        context.ProjectMembers.AddRange(projectIds.Select(projectId => new ProjectMember
        {
            ProjectId = projectId,
            UserId = currentUserId,
            Role = invitation.Role,
            JoinedAt = now
        }));

        invitation.AcceptedAt = now;
        var notification = new Notification
        {
            UserId = invitation.InvitedByUserId,
            WorkspaceId = workspace.Id,
            Title = "Convite aceito",
            Message = account.FullName,
            Type = "invitation_accepted",
            CreatedAt = now
        };
        context.Notifications.Add(notification);
        await context.SaveChangesAsync(cancellationToken);

        await activityRecorder.RecordAsync(workspace.Id, null, null, currentUserId, "members",
            currentUserId.ToString(), account.FullName, "aceitou o convite", cancellationToken);
        await notificationEmails.QueueAsync(notification, cancellationToken);

        return Ok(new { workspaceId = workspace.Id, workspaceName = workspace.Name });
    }

    private Task<Workspace?> GetWorkspace(Guid workspaceId, Guid currentUserId, CancellationToken cancellationToken)
    {
        return context.Workspaces.Include(workspace => workspace.Members)
            .FirstOrDefaultAsync(workspace => workspace.Id == workspaceId, cancellationToken);
    }

    private static bool CanManage(Workspace workspace, Guid currentUserId) =>
        workspace.OwnerId == currentUserId || workspace.Members.Any(member =>
            member.UserId == currentUserId && member.Role == "Manager");

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out userId);
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string? NormalizeRole(string role) => role.Trim().ToLowerInvariant() switch
    {
        "manager" or "gerente" or "responsável" => "Manager",
        "observer" or "observador" => "Observer",
        "member" or "membro" or "colaborador" => "Member",
        _ => null
    };

    public sealed record CreateInvitationRequest(string? Email, string? Role);
    public sealed record AcceptInvitationRequest(string? Token);
    public sealed record InvitationResponse(Guid Id, string Email, string Role, DateTime CreatedAt, DateTime ExpiresAt);
}
