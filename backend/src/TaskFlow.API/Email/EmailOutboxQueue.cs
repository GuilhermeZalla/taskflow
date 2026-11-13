using Microsoft.AspNetCore.DataProtection;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Email;

public sealed record QueuedEmail(string Recipient, string Subject, string HtmlBody, string TextBody);

public interface IEmailOutboxQueue
{
    System.Threading.Tasks.Task EnqueueAsync(QueuedEmail email, CancellationToken cancellationToken);
}

public sealed class EmailOutboxQueue(AppDbContext context, IDataProtectionProvider dataProtectionProvider)
    : IEmailOutboxQueue
{
    private readonly IDataProtector _protector = dataProtectionProvider.CreateProtector("TaskFlow.EmailOutbox.v1");

    public async System.Threading.Tasks.Task EnqueueAsync(QueuedEmail email, CancellationToken cancellationToken)
    {
        context.EmailOutboxMessages.Add(new EmailOutboxMessage
        {
            RecipientEmail = email.Recipient.Trim(),
            Subject = email.Subject,
            ProtectedHtmlBody = _protector.Protect(email.HtmlBody),
            ProtectedTextBody = _protector.Protect(email.TextBody),
            CreatedAt = DateTime.UtcNow,
            NextAttemptAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync(cancellationToken);
    }
}
