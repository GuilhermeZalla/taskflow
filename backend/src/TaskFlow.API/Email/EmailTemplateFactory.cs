using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Email;

public sealed class EmailTemplateFactory(
    IHttpContextAccessor httpContextAccessor,
    IOptions<EmailOptions> options)
{
    public QueuedEmail Confirmation(ApplicationUser user, string email, string confirmationLink)
    {
        var english = IsEnglish;
        var link = NormalizeConfirmationLink(confirmationLink);
        var name = WebUtility.HtmlEncode(user.FullName);
        return Create(
            email,
            english ? "Confirm your TaskFlow account" : "Confirme sua conta TaskFlow",
            english ? "One step left" : "Falta só confirmar",
            english ? $"Hi {name}, confirm your email address to activate your account." : $"Olá, {name}, confirme seu e-mail para ativar sua conta.",
            english ? "Confirm email" : "Confirmar e-mail",
            english ? "If you did not create this account, you can ignore this message." : "Se você não criou esta conta, ignore esta mensagem.",
            link,
            english);
    }

    public QueuedEmail PasswordReset(ApplicationUser user, string email, string resetCode)
    {
        var english = IsEnglish;
        var link = BuildFrontendLink("reset-password", new Dictionary<string, string>
        {
            ["email"] = email,
            ["resetCode"] = resetCode
        });
        var name = WebUtility.HtmlEncode(user.FullName);
        return Create(
            email,
            english ? "Reset your TaskFlow password" : "Redefina sua senha do TaskFlow",
            english ? "Password reset requested" : "Solicitação de redefinição de senha",
            english ? $"Hi {name}, use the link below to choose a new password. The link can be used once." : $"Olá, {name}, use o link abaixo para escolher uma nova senha. O link pode ser usado uma vez.",
            english ? "Reset password" : "Redefinir senha",
            english ? "If you did not request this, you can ignore this message." : "Se você não pediu a redefinição, ignore esta mensagem.",
            link,
            english);
    }

    public QueuedEmail Invitation(string recipient, string workspaceName, string inviterName, string role, string link)
    {
        var english = IsEnglish;
        var safeWorkspace = WebUtility.HtmlEncode(workspaceName);
        var safeInviter = WebUtility.HtmlEncode(inviterName);
        var safeRole = WebUtility.HtmlEncode(role);
        return Create(
            recipient,
            english ? $"Invitation to {workspaceName} on TaskFlow" : $"Convite para {workspaceName} no TaskFlow",
            english ? "A workspace is waiting for you" : "Um espaço de trabalho espera por você",
            english
                ? $"{safeInviter} invited you to join <strong>{safeWorkspace}</strong> as {safeRole}. Sign in or create an account with this email address to accept."
                : $"{safeInviter} convidou você para participar de <strong>{safeWorkspace}</strong> como {safeRole}. Entre ou crie uma conta com este e-mail para aceitar.",
            english ? "View invitation" : "Ver convite",
            english ? "This invitation expires in seven days. If you were not expecting it, ignore this message." : "Este convite expira em sete dias. Se não estava esperando por ele, ignore esta mensagem.",
            link,
            english);
    }

    public QueuedEmail Notification(string recipient, string title, string message, string link, string language)
    {
        var english = IsEnglishLanguage(language);
        var safeTitle = WebUtility.HtmlEncode(title);
        var safeMessage = WebUtility.HtmlEncode(message);
        return Create(
            recipient,
            english ? $"TaskFlow notification: {title}" : $"Notificação do TaskFlow: {title}",
            english ? "You have a TaskFlow update" : "Você tem uma atualização no TaskFlow",
            $"<strong>{safeTitle}</strong><br>{safeMessage}",
            english ? "Open TaskFlow" : "Abrir TaskFlow",
            english ? "You can turn off email notifications in your account preferences." : "Você pode desativar notificações por e-mail nas preferências da sua conta.",
            link,
            english);
    }

    public string GetCurrentLanguage()
    {
        var header = httpContextAccessor.HttpContext?.Request.Headers.AcceptLanguage.ToString();
        return IsEnglishLanguage(header) ? "en" : IsEnglishLanguage(options.Value.DefaultLanguage) ? "en" : "pt-BR";
    }

    public string BuildFrontendLink(string path, IReadOnlyDictionary<string, string> query)
    {
        var baseUrl = options.Value.FrontendBaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/{path.TrimStart('/')}";
        var queryString = string.Join("&", query.Select(pair =>
            $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"));
        return queryString.Length == 0 ? url : $"{url}?{queryString}";
    }

    private string NormalizeConfirmationLink(string callbackLink)
    {
        callbackLink = WebUtility.HtmlDecode(callbackLink);
        if (!Uri.TryCreate(callbackLink, UriKind.Absolute, out var callback))
        {
            return callbackLink;
        }

        var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(callback.Query);
        if (!query.TryGetValue("userId", out var userId) || !query.TryGetValue("code", out var code))
        {
            return callbackLink;
        }

        var values = new Dictionary<string, string>
        {
            ["userId"] = userId.ToString(),
            ["code"] = code.ToString()
        };
        if (query.TryGetValue("changedEmail", out var changedEmail))
        {
            values["changedEmail"] = changedEmail.ToString();
        }

        return BuildFrontendLink("confirm-email", values);
    }

    private bool IsEnglish => IsEnglishLanguage(httpContextAccessor.HttpContext?.Request.Headers.AcceptLanguage.ToString());

    private bool IsEnglishLanguage(string? language) =>
        !string.IsNullOrWhiteSpace(language) && language.StartsWith("en", StringComparison.OrdinalIgnoreCase);

    private static QueuedEmail Create(
        string recipient,
        string subject,
        string heading,
        string body,
        string actionLabel,
        string note,
        string link,
        bool english)
    {
        var safeHeading = WebUtility.HtmlEncode(heading);
        var safeAction = WebUtility.HtmlEncode(actionLabel);
        var safeNote = WebUtility.HtmlEncode(note);
        var safeLink = WebUtility.HtmlEncode(link);
        var html = $"<!doctype html><html><body style=\"margin:0;background:#f4f5ef;color:#272e29;font-family:Arial,sans-serif\"><main style=\"max-width:560px;margin:32px auto;padding:32px;background:#fff;border:1px solid #dce2d7\"><p style=\"color:#244c3b;font-weight:700\">TaskFlow</p><h1 style=\"font-size:24px\">{safeHeading}</h1><p style=\"line-height:1.6\">{body}</p><p style=\"margin:28px 0\"><a href=\"{safeLink}\" style=\"display:inline-block;background:#244c3b;color:#fff;padding:12px 18px;text-decoration:none\">{safeAction}</a></p><p style=\"font-size:13px;color:#59635c;line-height:1.5\">{safeNote}</p></main></body></html>";
        var text = $"{heading}\n\n{StripHtml(body)}\n\n{actionLabel}: {link}\n\n{note}";
        return new QueuedEmail(recipient, subject, html, text);
    }

    private static string StripHtml(string value) =>
        System.Text.RegularExpressions.Regex.Replace(value, "<[^>]+>", " ");
}
