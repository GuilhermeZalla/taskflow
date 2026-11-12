using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Collaboration;

[ApiController]
[Authorize]
[Route("api/tasks/{taskId:guid}/comments")]
public sealed class TaskCommentsController(
    AppDbContext context,
    UserManager<ApplicationUser> userManager,
    ActivityRecorder activityRecorder) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetComments(Guid taskId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        var comments = await context.Comments
            .Where(comment => comment.TaskId == taskId)
            .OrderBy(comment => comment.CreatedAt)
            .ToListAsync(cancellationToken);
        var commentIds = comments.Select(comment => comment.Id).ToArray();
        var mentions = await context.CommentMentions
            .Where(mention => commentIds.Contains(mention.CommentId))
            .ToListAsync(cancellationToken);
        var authorIds = comments.Select(comment => comment.UserId.ToString()).Distinct().ToArray();
        var mentionedIds = mentions.Select(mention => mention.UserId.ToString()).Distinct().ToArray();
        var users = await context.Users
            .Where(user => authorIds.Contains(user.Id) || mentionedIds.Contains(user.Id))
            .ToDictionaryAsync(user => Guid.Parse(user.Id), cancellationToken);

        return Ok(comments.Select(comment => new
        {
            comment.Id,
            comment.TaskId,
            comment.UserId,
            AuthorName = users.GetValueOrDefault(comment.UserId)?.FullName ?? "TaskFlow user",
            comment.Content,
            comment.CreatedAt,
            comment.UpdatedAt,
            Mentions = mentions
                .Where(mention => mention.CommentId == comment.Id && users.ContainsKey(mention.UserId))
                .Select(mention => new { UserId = mention.UserId, Name = users[mention.UserId].FullName })
        }));
    }

    [HttpPost]
    public async Task<IActionResult> CreateComment(
        Guid taskId,
        [FromBody] CreateCommentRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var task = await GetAccessibleTask(taskId, userId, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        var content = request.Content.Trim();
        if (content.Length is 0 or > 2000)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["content"] = ["O comentário deve ter entre 1 e 2.000 caracteres."]
            }));
        }

        var workspaceMemberIds = await context.WorkspaceMembers
            .Where(member => member.WorkspaceId == task.Project.WorkspaceId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);
        workspaceMemberIds.Add(task.Project.Workspace.OwnerId);
        var mentionedIds = (request.MentionedUserIds ?? [])
            .Distinct()
            .Where(mentionedId => mentionedId != userId)
            .ToArray();

        if (mentionedIds.Except(workspaceMemberIds).Any())
        {
            return BadRequest(new ProblemDetails { Title = "Só é possível mencionar pessoas deste espaço." });
        }

        var mentionedIdentityIds = mentionedIds.Select(id => id.ToString()).ToArray();
        var mentionedUsers = await context.Users
            .Where(user => mentionedIdentityIds.Contains(user.Id))
            .ToListAsync(cancellationToken);
        var mentionedNames = mentionedUsers.ToDictionary(user => Guid.Parse(user.Id), user => user.FullName);

        var comment = new Comment
        {
            TaskId = taskId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };
        context.Comments.Add(comment);
        context.CommentMentions.AddRange(mentionedIds.Select(mentionedId => new CommentMention
        {
            CommentId = comment.Id,
            UserId = mentionedId
        }));
        context.Notifications.AddRange(mentionedIds.Select(mentionedId => new Notification
        {
            UserId = mentionedId,
            WorkspaceId = task.Project.WorkspaceId,
            ProjectId = task.ProjectId,
            TaskId = taskId,
            Title = "Você foi mencionado em um comentário",
            Message = task.Title,
            Type = "mention",
            CreatedAt = DateTime.UtcNow
        }));

        await context.SaveChangesAsync(cancellationToken);
        await activityRecorder.RecordAsync(
            task.Project.WorkspaceId, task.ProjectId, taskId, userId,
            "tasks", taskId.ToString(), task.Title, "comentário adicionado", cancellationToken);

        var author = await userManager.FindByIdAsync(userId.ToString());
        return Created($"/api/tasks/{taskId}/comments/{comment.Id}", new
        {
            comment.Id,
            comment.TaskId,
            comment.UserId,
            AuthorName = author?.FullName ?? "TaskFlow user",
            comment.Content,
            comment.CreatedAt,
            comment.UpdatedAt,
            Mentions = mentionedIds.Select(mentionedId => new
            {
                UserId = mentionedId,
                Name = mentionedNames.GetValueOrDefault(mentionedId) ?? "TaskFlow user"
            })
        });
    }

    [HttpPut("{commentId:guid}")]
    public async Task<IActionResult> UpdateComment(
        Guid taskId,
        Guid commentId,
        [FromBody] UpdateCommentRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var comment = await context.Comments
            .Include(item => item.Task)
            .ThenInclude(task => task.Project)
            .FirstOrDefaultAsync(item => item.Id == commentId && item.TaskId == taskId, cancellationToken);
        if (comment is null || await GetAccessibleTask(taskId, userId, cancellationToken) is null)
        {
            return NotFound();
        }

        if (comment.UserId != userId)
        {
            return Forbid();
        }

        var content = request.Content.Trim();
        if (content.Length is 0 or > 2000)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["content"] = ["O comentário deve ter entre 1 e 2.000 caracteres."]
            }));
        }

        comment.Content = content;
        comment.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        await activityRecorder.RecordAsync(
            comment.Task.Project.WorkspaceId, comment.Task.ProjectId, taskId, userId,
            "tasks", taskId.ToString(), comment.Task.Title, "comentário atualizado", cancellationToken);
        return NoContent();
    }

    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid taskId, Guid commentId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var comment = await context.Comments
            .Include(item => item.Task)
            .ThenInclude(task => task.Project)
            .FirstOrDefaultAsync(item => item.Id == commentId && item.TaskId == taskId, cancellationToken);
        if (comment is null || await GetAccessibleTask(taskId, userId, cancellationToken) is null)
        {
            return NotFound();
        }

        if (comment.UserId != userId)
        {
            return Forbid();
        }

        var workspaceId = comment.Task.Project.WorkspaceId;
        var projectId = comment.Task.ProjectId;
        var taskTitle = comment.Task.Title;
        context.Comments.Remove(comment);
        await context.SaveChangesAsync(cancellationToken);
        await activityRecorder.RecordAsync(
            workspaceId, projectId, taskId, userId,
            "tasks", taskId.ToString(), taskTitle, "comentário removido", cancellationToken);
        return NoContent();
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

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(value, out userId);
    }

    public sealed record CreateCommentRequest(string Content, Guid[]? MentionedUserIds);
    public sealed record UpdateCommentRequest(string Content);
}
