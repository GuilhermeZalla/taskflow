using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.IntegrationTests;

public sealed class EmailWorkflowTests
{
    [Fact]
    public async Task RegistrationRequiresConfirmationAndPasswordCanBeResetByEmail()
    {
        using var factory = new TaskFlowApiFactory();
        using var client = factory.CreateClient();

        var registration = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Email User",
            email = "email-user@example.com",
            password = "StrongPassword123"
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);

        var pendingLogin = await client.PostAsJsonAsync("/login", new
        {
            email = "email-user@example.com",
            password = "StrongPassword123"
        });
        Assert.Equal(HttpStatusCode.OK, pendingLogin.StatusCode);

        var resendConfirmation = await client.PostAsJsonAsync("/resendConfirmationEmail", new
        {
            email = "email-user@example.com"
        });
        Assert.Equal(HttpStatusCode.OK, resendConfirmation.StatusCode);
        await Task.Delay(20);

        var confirmationMessage = await ReadOutboxMessage(factory, "email-user@example.com", 1);
        var confirmationUrl = ReadLink(confirmationMessage, "Confirmar e-mail: ");
        var confirmationQuery = QueryHelpers.ParseQuery(new Uri(confirmationUrl).Query);
        Assert.True(confirmationQuery.ContainsKey("code"), confirmationUrl);
        var confirmation = await client.GetAsync(
            $"/confirmEmail?userId={Uri.EscapeDataString(confirmationQuery["userId"].ToString())}" +
            $"&code={Uri.EscapeDataString(confirmationQuery["code"].ToString())}");
        Assert.Equal(HttpStatusCode.OK, confirmation.StatusCode);

        var forgotPassword = await client.PostAsJsonAsync("/forgotPassword", new
        {
            email = "email-user@example.com"
        });
        Assert.Equal(HttpStatusCode.OK, forgotPassword.StatusCode);

        var resetMessage = await ReadOutboxMessage(factory, "email-user@example.com", 2);
        var resetUrl = ReadLink(resetMessage, "Redefinir senha: ");
        var resetQuery = QueryHelpers.ParseQuery(new Uri(resetUrl).Query);
        var reset = await client.PostAsJsonAsync("/resetPassword", new
        {
            email = "email-user@example.com",
            resetCode = resetQuery["resetCode"].ToString(),
            newPassword = "NewStrongPassword456"
        });
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

        var login = await client.PostAsJsonAsync("/login", new
        {
            email = "email-user@example.com",
            password = "NewStrongPassword456"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task WorkspaceInvitationCanBeAcceptedOnlyByTheConfirmedRecipient()
    {
        using var factory = new TaskFlowApiFactory();
        using var owner = factory.CreateClient();
        using var invitee = factory.CreateClient();
        using var outsider = factory.CreateClient();
        await RegisterAndLogin(factory, owner, "owner-invite@example.com");
        await RegisterAndLogin(factory, outsider, "outsider-invite@example.com");

        var workspaceResponse = await owner.PostAsJsonAsync("/api/workspaces", new { name = "Planning room" });
        Assert.Equal(HttpStatusCode.Created, workspaceResponse.StatusCode);
        var workspaceId = (await ReadJson(workspaceResponse)).GetProperty("id").GetGuid();

        var invitationResponse = await owner.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/invitations",
            new { email = "invitee@example.com", role = "Member" });
        Assert.Equal(HttpStatusCode.Accepted, invitationResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await outsider.GetAsync(
            $"/api/workspaces/{workspaceId}/invitations")).StatusCode);

        var pendingInvitations = await owner.GetFromJsonAsync<JsonElement[]>(
            $"/api/workspaces/{workspaceId}/invitations");
        Assert.NotNull(pendingInvitations);
        Assert.Single(pendingInvitations);

        var invitationMessage = await ReadOutboxMessage(factory, "invitee@example.com", 0);
        var oldInvitationUrl = ReadLink(invitationMessage, "Ver convite: ");
        var oldInvitationToken = QueryHelpers.ParseQuery(new Uri(oldInvitationUrl).Query)["token"].ToString();
        var resentInvitation = await owner.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/invitations",
            new { email = "invitee@example.com", role = "Observer" });
        Assert.Equal(HttpStatusCode.Accepted, resentInvitation.StatusCode);
        await Task.Delay(20);
        var refreshedInvitation = await ReadOutboxMessage(factory, "invitee@example.com", 1);
        var invitationUrl = ReadLink(refreshedInvitation, "Ver convite: ");
        var invitationToken = QueryHelpers.ParseQuery(new Uri(invitationUrl).Query)["token"].ToString();

        var registration = await invitee.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Invitee",
            email = "invitee@example.com",
            password = "StrongPassword123"
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);

        var beforeConfirmation = await invitee.PostAsJsonAsync(
            "/api/invitations/accept", new { token = oldInvitationToken });
        Assert.Equal(HttpStatusCode.Unauthorized, beforeConfirmation.StatusCode);

        await factory.ConfirmEmailAsync("invitee@example.com");
        await Login(invitee, "invitee@example.com", "StrongPassword123");
        using var wrongRecipient = factory.CreateClient();
        await RegisterAndLogin(factory, wrongRecipient, "wrong-recipient@example.com");
        Assert.Equal(HttpStatusCode.Forbidden, (await wrongRecipient.PostAsJsonAsync(
            "/api/invitations/accept", new { token = invitationToken })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await invitee.PostAsJsonAsync(
            "/api/invitations/accept", new { token = oldInvitationToken })).StatusCode);
        var revokedToken = await owner.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/invitations",
            new { email = "cancel@example.com", role = "Member" });
        Assert.Equal(HttpStatusCode.Accepted, revokedToken.StatusCode);
        var cancellationId = (await ReadJson(revokedToken)).GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync(
            $"/api/workspaces/{workspaceId}/invitations/{cancellationId}")).StatusCode);
        var accepted = await invitee.PostAsJsonAsync(
            "/api/invitations/accept", new { token = invitationToken });
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);

        var workspaces = await invitee.GetFromJsonAsync<JsonElement[]>("/api/workspaces");
        Assert.NotNull(workspaces);
        Assert.Contains(workspaces, workspace => workspace.GetProperty("id").GetGuid() == workspaceId);
        var noPendingInvitations = await owner.GetFromJsonAsync<JsonElement[]>(
            $"/api/workspaces/{workspaceId}/invitations");
        Assert.NotNull(noPendingInvitations);
        Assert.Empty(noPendingInvitations);
    }

    private static async Task RegisterAndLogin(TaskFlowApiFactory factory, HttpClient client, string email)
    {
        var registration = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = email,
            email,
            password = "StrongPassword123"
        });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        await factory.ConfirmEmailAsync(email);
        await Login(client, email, "StrongPassword123");
    }

    private static async Task Login(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = (await ReadJson(response)).GetProperty("accessToken").GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private static async Task<string> ReadOutboxMessage(
        TaskFlowApiFactory factory,
        string recipient,
        int index)
    {
        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var message = await context.EmailOutboxMessages
            .Where(item => item.RecipientEmail == recipient)
            .OrderBy(item => item.CreatedAt)
            .Skip(index)
            .FirstAsync();
        var protector = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("TaskFlow.EmailOutbox.v1");
        return protector.Unprotect(message.ProtectedTextBody);
    }

    private static string ReadLink(string body, string label)
    {
        var start = body.IndexOf(label, StringComparison.Ordinal);
        Assert.True(start >= 0, $"Email body did not contain the expected link label: {label}");
        var link = body[(start + label.Length)..].Split('\n', StringSplitOptions.TrimEntries)[0];
        Assert.True(Uri.TryCreate(link, UriKind.Absolute, out _), "Email link was not an absolute URL.");
        return link;
    }

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();
}
