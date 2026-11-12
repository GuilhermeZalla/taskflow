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
