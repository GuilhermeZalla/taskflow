using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators;

public class CreateWorkspaceDtoValidator : AbstractValidator<CreateWorkspaceDto>
{
    public CreateWorkspaceDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome do workspace é obrigatório.")
            .MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição deve ter no máximo 500 caracteres.");
    }
}

public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(x => x.WorkspaceId)
            .NotEmpty().WithMessage("O workspace é obrigatório.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome do projeto é obrigatório.")
            .MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("O status é obrigatório.")
            .MaximumLength(50).WithMessage("O status deve ter no máximo 50 caracteres.");
    }
}

public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
{
    public CreateTaskDtoValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("O projeto é obrigatório.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("O título é obrigatório.")
            .MaximumLength(200).WithMessage("O título deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("A descrição deve ter no máximo 1000 caracteres.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("O status é obrigatório.")
            .MaximumLength(50).WithMessage("O status deve ter no máximo 50 caracteres.");

        RuleFor(x => x.Priority)
            .NotEmpty().WithMessage("A prioridade é obrigatória.")
            .MaximumLength(50).WithMessage("A prioridade deve ter no máximo 50 caracteres.");
    }
}
