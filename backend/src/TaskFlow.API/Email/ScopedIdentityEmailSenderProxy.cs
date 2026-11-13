using Microsoft.AspNetCore.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Email;

public sealed class ScopedIdentityEmailSenderProxy(IServiceScopeFactory scopeFactory)
    : IEmailSender<ApplicationUser>
{
    public async Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var sender = scope.ServiceProvider.GetRequiredService<IdentityEmailSender>();
        await sender.SendConfirmationLinkAsync(user, email, confirmationLink);
    }

    public async Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var sender = scope.ServiceProvider.GetRequiredService<IdentityEmailSender>();
        await sender.SendPasswordResetCodeAsync(user, email, resetCode);
    }

    public async Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var sender = scope.ServiceProvider.GetRequiredService<IdentityEmailSender>();
        await sender.SendPasswordResetLinkAsync(user, email, resetLink);
    }
}
