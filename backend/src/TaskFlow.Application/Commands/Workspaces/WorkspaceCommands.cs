using MediatR;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Commands.Workspaces;

public record CreateWorkspaceCommand(CreateWorkspaceDto Dto, Guid UserId) : IRequest<WorkspaceDto>;

public record UpdateWorkspaceCommand(Guid Id, string Name, string? Description, Guid UserId) : IRequest<WorkspaceDto>;

public record DeleteWorkspaceCommand(Guid Id, Guid UserId) : IRequest<bool>;
