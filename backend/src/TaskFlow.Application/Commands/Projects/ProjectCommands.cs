using MediatR;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Commands.Projects;

public record CreateProjectCommand(CreateProjectDto Dto, Guid UserId) : IRequest<ProjectDto>;

public record UpdateProjectCommand(Guid Id, string Name, string? Description, string Status, DateTime? StartDate, DateTime? DueDate, Guid UserId) : IRequest<ProjectDto>;

public record DeleteProjectCommand(Guid Id, Guid UserId) : IRequest<bool>;
