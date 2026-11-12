using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Collaboration;

public sealed class TaskReminderService(
    IServiceScopeFactory scopeFactory,
    ILogger<TaskReminderService> logger) : BackgroundService
{
    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(15));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await CreateUpcomingDeadlineNotifications(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to create deadline reminders.");
            }
        }
    }

    private async System.Threading.Tasks.Task CreateUpcomingDeadlineNotifications(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        var cutoff = now.AddHours(24);
        var upcomingTasks = await context.Tasks
            .Include(task => task.Project)
            .Where(task => task.DueDate >= now && task.DueDate <= cutoff)
            .Where(task => task.ReminderSentAt == null)
            .Where(task => task.Status != "Done" && task.Status != "Completed")
            .ToListAsync(cancellationToken);

        foreach (var task in upcomingTasks)
        {
            var recipientId = task.AssignedToId ?? task.CreatedById;
            if (recipientId == Guid.Empty)
            {
                continue;
            }

            context.Notifications.Add(new Notification
            {
                UserId = recipientId,
                WorkspaceId = task.Project.WorkspaceId,
                ProjectId = task.ProjectId,
                TaskId = task.Id,
                Title = "Prazo se aproxima",
                Message = task.Title,
                Type = "deadline",
                CreatedAt = now
            });
            task.ReminderSentAt = now;
        }

        if (upcomingTasks.Count > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
