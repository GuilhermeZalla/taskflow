using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace TaskFlow.API.Email;

public interface IEmailDelivery
{
    Task SendAsync(string recipient, string subject, string htmlBody, string textBody, CancellationToken cancellationToken);
}

public sealed class SmtpEmailDelivery(IOptionsMonitor<EmailOptions> options) : IEmailDelivery
{
    public async Task SendAsync(
        string recipient,
        string subject,
        string htmlBody,
        string textBody,
        CancellationToken cancellationToken)
    {
        var smtp = options.CurrentValue.Smtp;
        if (!smtp.IsConfigured)
        {
            throw new InvalidOperationException("SMTP is not configured.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(smtp.FromName, smtp.FromAddress));
        message.To.Add(MailboxAddress.Parse(recipient));
        message.Subject = subject;
        message.Body = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        }.ToMessageBody();

        using var client = new SmtpClient();
        var security = smtp.UseSslOnConnect
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
        await client.ConnectAsync(smtp.Host, smtp.Port, security, cancellationToken);

        if (!string.IsNullOrWhiteSpace(smtp.Username))
        {
            await client.AuthenticateAsync(smtp.Username, smtp.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
