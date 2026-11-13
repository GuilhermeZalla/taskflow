using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Email;

public sealed class ExternalNotificationEmailService(
    AppDbContext context,
    IEmailOutboxQueue outboxQueue,
    EmailTemplateFactory templates,
    IOptions<EmailOptions> options)
{
    public async System.Threading.Tasks.Task QueueAsync(Notification notification, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(
            account => account.Id == notification.UserId.ToString(),
            cancellationToken);
        if (user is null || !user.EmailConfirmed || !user.EmailNotificationsEnabled ||
            string.IsNullOrWhiteSpace(user.Email))
        {
            return;
        }

        var link = notification.TaskId.HasValue
            ? templates.BuildFrontendLink($"tasks/{notification.TaskId.Value}/edit", new Dictionary<string, string>())
            : templates.BuildFrontendLink("activity", new Dictionary<string, string>());
        var language = string.IsNullOrWhiteSpace(user.PreferredLanguage)
            ? options.Value.DefaultLanguage
            : user.PreferredLanguage;
        var email = templates.Notification(user.Email, notification.Title, notification.Message, link, language);
        await outboxQueue.EnqueueAsync(email, cancellationToken);
    }
}
