using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace TaskFlow.IntegrationTests;

public class CollaborationWorkflowTests
{
    [Fact]
    public async Task LabelsDependenciesAndTemplates_RejectInvalidLinksAndCopyTasks()
    {
        using var factory = new TaskFlowApiFactory();
        using var owner = factory.CreateClient();
        using var outsider = factory.CreateClient();
        await RegisterAndLogin(owner, "planner@example.com");
        await RegisterAndLogin(outsider, "other@example.com");

        var workspace = await owner.PostAsJsonAsync("/api/workspaces", new { name = "Planning" });
        var workspaceId = (await ReadJson(workspace)).GetProperty("id").GetGuid();
        var project = await owner.PostAsJsonAsync("/api/projects", new { workspaceId, name = "Roadmap" });
        var projectId = (await ReadJson(project)).GetProperty("id").GetGuid();
        var firstTask = await owner.PostAsJsonAsync("/api/tasks", new { projectId, title = "Design" });
        var firstTaskId = (await ReadJson(firstTask)).GetProperty("id").GetGuid();
        var secondTask = await owner.PostAsJsonAsync("/api/tasks", new { projectId, title = "Build" });
        var secondTaskId = (await ReadJson(secondTask)).GetProperty("id").GetGuid();

        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/workspaces/{workspaceId}/labels")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await outsider.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/labels", new { name = "Ready", color = "#244C3B" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/labels", new { name = "Ready", color = "green" })).StatusCode);

        var label = await owner.PostAsJsonAsync($"/api/workspaces/{workspaceId}/labels", new
        {
            name = "Ready", color = "#244c3b"
        });
        Assert.Equal(HttpStatusCode.Created, label.StatusCode);
        var labelId = (await ReadJson(label)).GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.NoContent, (await owner.PutAsJsonAsync(
            $"/api/tasks/{firstTaskId}/labels", new { labelIds = new[] { labelId } })).StatusCode);
        var taskLabels = await owner.GetFromJsonAsync<JsonElement[]>($"/api/tasks/{firstTaskId}/labels");
        Assert.NotNull(taskLabels);
        Assert.Single(taskLabels);

        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync(
            $"/api/tasks/{firstTaskId}/dependencies", new { dependsOnTaskId = firstTaskId })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await owner.PostAsJsonAsync(
            $"/api/tasks/{secondTaskId}/dependencies", new { dependsOnTaskId = firstTaskId })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.PostAsJsonAsync(
            $"/api/tasks/{firstTaskId}/dependencies", new { dependsOnTaskId = secondTaskId })).StatusCode);

        var template = await owner.PostAsJsonAsync($"/api/workspaces/{workspaceId}/templates", new
        {
            name = "Roadmap copy", projectId
        });
        Assert.Equal(HttpStatusCode.Created, template.StatusCode);
        var templateBody = await ReadJson(template);
        Assert.Equal(2, templateBody.GetProperty("taskCount").GetInt32());
        var templateId = templateBody.GetProperty("id").GetGuid();
        var copiedProject = await owner.PostAsJsonAsync($"/api/templates/{templateId}/apply", new
        {
            name = "Next roadmap"
        });
        Assert.Equal(HttpStatusCode.Created, copiedProject.StatusCode);
    }

    [Fact]
    public async Task MembersCommentsAndNotifications_FollowWorkspacePermissions()
    {
        using var factory = new TaskFlowApiFactory();
        using var owner = factory.CreateClient();
        using var member = factory.CreateClient();
        using var outsider = factory.CreateClient();

        var ownerId = await RegisterAndLogin(owner, "owner@example.com");
        var memberId = await RegisterAndLogin(member, "member@example.com");
        await RegisterAndLogin(outsider, "outsider@example.com");

        var workspaceResponse = await owner.PostAsJsonAsync("/api/workspaces", new { name = "Release team" });
        Assert.Equal(HttpStatusCode.Created, workspaceResponse.StatusCode);
        var workspaceId = (await ReadJson(workspaceResponse)).GetProperty("id").GetGuid();

        var projectResponse = await owner.PostAsJsonAsync("/api/projects", new { workspaceId, name = "Version 1" });
        Assert.Equal(HttpStatusCode.Created, projectResponse.StatusCode);
        var projectId = (await ReadJson(projectResponse)).GetProperty("id").GetGuid();

        var taskResponse = await owner.PostAsJsonAsync("/api/tasks", new { projectId, title = "Review release" });
        Assert.Equal(HttpStatusCode.Created, taskResponse.StatusCode);
        var taskId = (await ReadJson(taskResponse)).GetProperty("id").GetGuid();

        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/tasks/{taskId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await member.GetAsync($"/api/tasks/{taskId}/comments")).StatusCode);

        var addMember = await owner.PostAsJsonAsync($"/api/workspaces/{workspaceId}/members", new
        {
            email = "member@example.com", role = "Member"
        });
        Assert.Equal(HttpStatusCode.Created, addMember.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await owner.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/members", new { email = "member@example.com", role = "Member" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await member.PostAsJsonAsync(
            $"/api/workspaces/{workspaceId}/members", new { email = "outsider@example.com", role = "Member" })).StatusCode);

        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync(
            $"/api/tasks/{taskId}/comments", new { content = (string?)null })).StatusCode);

        var commentResponse = await owner.PostAsJsonAsync($"/api/tasks/{taskId}/comments", new
        {
            content = "Please check the release", mentionedUserIds = new[] { memberId }
        });
        Assert.Equal(HttpStatusCode.Created, commentResponse.StatusCode);
        var comment = await ReadJson(commentResponse);
        Assert.Equal(ownerId, comment.GetProperty("userId").GetGuid());
        Assert.Single(comment.GetProperty("mentions").EnumerateArray());

        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/api/tasks/{taskId}/comments")).StatusCode);
        var notifications = await member.GetFromJsonAsync<JsonElement[]>("/api/notifications");
        Assert.NotNull(notifications);
        Assert.Contains(notifications, notification => notification.GetProperty("type").GetString() == "mention");

        var unread = await member.GetFromJsonAsync<JsonElement>("/api/notifications/unread-count");
        Assert.True(unread.GetProperty("count").GetInt32() >= 1);
        var mentionId = notifications.Single(notification => notification.GetProperty("type").GetString() == "mention")
            .GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.PutAsync($"/api/notifications/{mentionId}/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await member.PutAsync($"/api/notifications/{mentionId}/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await member.PutAsync("/api/notifications/read-all", null)).StatusCode);
        var remaining = await member.GetFromJsonAsync<JsonElement>("/api/notifications/unread-count");
        Assert.Equal(0, remaining.GetProperty("count").GetInt32());
    }

    private static async Task<Guid> RegisterAndLogin(HttpClient client, string email)
    {
        const string password = "StrongPassword123";
        var register = await client.PostAsJsonAsync("/api/auth/register", new { fullName = email, email, password });
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        var userId = (await ReadJson(register)).GetProperty("id").GetGuid();
        var login = await client.PostAsJsonAsync("/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var token = (await ReadJson(login)).GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return userId;
    }

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response)
    {
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }
}
