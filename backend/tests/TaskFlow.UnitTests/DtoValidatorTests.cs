using FluentValidation.TestHelper;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Validators;

namespace TaskFlow.UnitTests;

public class DtoValidatorTests
{
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void WorkspaceName_IsRequired(string name)
    {
        var validator = new CreateWorkspaceDtoValidator();

        var result = validator.TestValidate(new CreateWorkspaceDto { Name = name });

        result.ShouldHaveValidationErrorFor(workspace => workspace.Name);
    }

    [Fact]
    public void WorkspaceName_CannotExceedMaximumLength()
    {
        var validator = new CreateWorkspaceDtoValidator();

        var result = validator.TestValidate(new CreateWorkspaceDto { Name = new string('a', 201) });

        result.ShouldHaveValidationErrorFor(workspace => workspace.Name);
    }

    [Fact]
    public void ProjectRequiresWorkspaceAndName()
    {
        var validator = new CreateProjectDtoValidator();

        var result = validator.TestValidate(new CreateProjectDto());

        result.ShouldHaveValidationErrorFor(project => project.WorkspaceId);
        result.ShouldHaveValidationErrorFor(project => project.Name);
    }

    [Fact]
    public void TaskRequiresProjectAndTitle()
    {
        var validator = new CreateTaskDtoValidator();

        var result = validator.TestValidate(new CreateTaskDto());

        result.ShouldHaveValidationErrorFor(task => task.ProjectId);
        result.ShouldHaveValidationErrorFor(task => task.Title);
    }
}
