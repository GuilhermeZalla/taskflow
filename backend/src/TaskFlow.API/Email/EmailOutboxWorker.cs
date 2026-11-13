using Microsoft.Extensions.Options;

namespace TaskFlow.API.Email;

public sealed class EmailOutboxWorker(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<EmailOptions> options,
    ILogger<EmailOutboxWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var warnedAboutConfiguration = false;
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(20));

        while (!stoppingToken.IsCancellationRequested)
        {
            if (!options.CurrentValue.Smtp.IsConfigured)
            {
                if (!warnedAboutConfiguration)
                {
                    logger.LogWarning("Email outbox is idle because SMTP settings are not configured.");
                    warnedAboutConfiguration = true;
                }
            }
            else
            {
                warnedAboutConfiguration = false;
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var processor = scope.ServiceProvider.GetRequiredService<EmailOutboxProcessor>();
                    await processor.ProcessBatchAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    logger.LogError(exception, "Email outbox processing failed.");
                }
            }

            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
