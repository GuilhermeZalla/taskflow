using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Email;

public sealed class IdentityEmailSender(
    IEmailOutboxQueue outboxQueue,
    EmailTemplateFactory templateFactory) : IEmailSender<ApplicationUser>
{
    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        return outboxQueue.EnqueueAsync(
            templateFactory.Confirmation(user, email, confirmationLink),
            CancellationToken.None);
    }

    public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        return outboxQueue.EnqueueAsync(
            templateFactory.PasswordReset(user, email, resetCode),
            CancellationToken.None);
    }

    public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        if (Uri.TryCreate(resetLink, UriKind.Absolute, out var callback))
        {
            var query = QueryHelpers.ParseQuery(callback.Query);
            if (query.TryGetValue("email", out var callbackEmail) &&
                (query.TryGetValue("resetCode", out var code) || query.TryGetValue("code", out code)))
            {
                return SendPasswordResetCodeAsync(user, callbackEmail.ToString(), code.ToString());
            }
        }

        return outboxQueue.EnqueueAsync(
            templateFactory.PasswordReset(user, email, resetLink),
            CancellationToken.None);
    }
}
