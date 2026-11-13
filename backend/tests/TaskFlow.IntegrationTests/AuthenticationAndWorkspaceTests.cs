using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace TaskFlow.IntegrationTests;

public class AuthenticationAndWorkspaceTests
{
    [Fact]
    public async Task RegistrationLoginProfileAndWorkspaceCrud_UseTheSameBearerScheme()
    {
        using var factory = new TaskFlowApiFactory();
        using var client = factory.CreateClient();

        var registration = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Taylor Example",
            email = "taylor@example.com",
            password = "StrongPassword123"
        });

        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);

        var unconfirmedLogin = await client.PostAsJsonAsync("/login", new
        {
            email = "taylor@example.com",
            password = "StrongPassword123"
        });
        Assert.Equal(HttpStatusCode.OK, unconfirmedLogin.StatusCode);
        using var pendingBody = JsonDocument.Parse(await unconfirmedLogin.Content.ReadAsStringAsync());
        var pendingToken = pendingBody.RootElement.GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pendingToken);
        var pendingProfile = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.False(pendingProfile.GetProperty("emailConfirmed").GetBoolean());
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/workspaces")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/workspaces", new { name = "Blocked" })).StatusCode);
        await factory.ConfirmEmailAsync("taylor@example.com");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/workspaces")).StatusCode);

        var login = await client.PostAsJsonAsync("/login", new
        {
            email = "taylor@example.com",
            password = "StrongPassword123"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        using var loginBody = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        var accessToken = loginBody.RootElement.GetProperty("accessToken").GetString();
        Assert.False(string.IsNullOrWhiteSpace(accessToken));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var profile = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal("taylor@example.com", profile.GetProperty("email").GetString());
        Assert.Equal("Taylor Example", profile.GetProperty("fullName").GetString());

        var languagePreference = await client.PutAsJsonAsync(
            "/api/auth/language", new { language = "en" });
        Assert.Equal(HttpStatusCode.OK, languagePreference.StatusCode);
        var updatedProfile = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal("en", updatedProfile.GetProperty("preferredLanguage").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(
            "/api/auth/language", new { language = "fr" })).StatusCode);

        var createWorkspace = await client.PostAsJsonAsync("/api/workspaces", new
        {
            name = "Product team",
            description = "Shared planning"
        });
        Assert.Equal(HttpStatusCode.Created, createWorkspace.StatusCode);

        var workspaces = await client.GetFromJsonAsync<JsonElement[]>("/api/workspaces");
        Assert.NotNull(workspaces);
        Assert.Single(workspaces);
        Assert.Equal("Product team", workspaces[0].GetProperty("name").GetString());
        Assert.Equal(1, workspaces[0].GetProperty("memberCount").GetInt32());
    }

    [Fact]
    public async Task ProtectedWorkspaceEndpoints_RejectAnonymousRequests()
    {
        using var factory = new TaskFlowApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/workspaces");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
