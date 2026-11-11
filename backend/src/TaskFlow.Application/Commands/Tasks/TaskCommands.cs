using MediatR;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Commands.Tasks;

public record CreateTaskCommand(CreateTaskDto Dto, Guid UserId) : IRequest<TaskDto>;

public record UpdateTaskCommand(Guid Id, string Title, string? Description, string Status, string Priority, Guid? AssignedToId, DateTime? DueDate, Guid UserId) : IRequest<TaskDto>;

public record DeleteTaskCommand(Guid Id, Guid UserId) : IRequest<bool>;
