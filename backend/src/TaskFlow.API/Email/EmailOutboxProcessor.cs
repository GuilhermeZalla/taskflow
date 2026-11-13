using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Email;

public sealed class EmailOutboxProcessor(
    AppDbContext context,
    IEmailDelivery emailDelivery,
    IDataProtectionProvider dataProtectionProvider,
    IOptionsMonitor<EmailOptions> options,
    ILogger<EmailOutboxProcessor> logger)
{
    private const int BatchSize = 20;
    private const int MaximumAttempts = 10;
    private readonly IDataProtector _protector = dataProtectionProvider.CreateProtector("TaskFlow.EmailOutbox.v1");

    public async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        if (!options.CurrentValue.Smtp.IsConfigured)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var messages = await context.EmailOutboxMessages
            .Where(message => message.SentAt == null && message.FailedAt == null && message.NextAttemptAt <= now)
            .OrderBy(message => message.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var message in messages)
        {
            try
            {
                var htmlBody = _protector.Unprotect(message.ProtectedHtmlBody);
                var textBody = _protector.Unprotect(message.ProtectedTextBody);
                await emailDelivery.SendAsync(
                    message.RecipientEmail,
                    message.Subject,
                    htmlBody,
                    textBody,
                    cancellationToken);
                message.SentAt = DateTime.UtcNow;
                message.LastErrorCode = null;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                message.AttemptCount++;
                message.LastErrorCode = exception.GetType().Name;
                if (message.AttemptCount >= MaximumAttempts)
                {
                    message.FailedAt = DateTime.UtcNow;
                }
                else
                {
                    message.NextAttemptAt = DateTime.UtcNow.Add(RetryDelay(message.AttemptCount));
                }

                logger.LogError(exception, "Email delivery failed for outbox message {MessageId}.", message.Id);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private static TimeSpan RetryDelay(int attempt) => attempt switch
    {
        1 => TimeSpan.FromMinutes(1),
        2 => TimeSpan.FromMinutes(5),
        3 => TimeSpan.FromMinutes(15),
        4 => TimeSpan.FromHours(1),
        _ => TimeSpan.FromHours(6)
    };
}
