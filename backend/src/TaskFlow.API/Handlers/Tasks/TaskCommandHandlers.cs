using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Commands.Tasks;
using TaskFlow.Application.DTOs;
using TaskFlow.Infrastructure.Persistence;
using DomainTask = TaskFlow.Domain.Entities.Task;

namespace TaskFlow.API.Handlers.Tasks;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly AppDbContext _context;

    public CreateTaskCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TaskDto> Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects.FindAsync([request.Dto.ProjectId], cancellationToken)
            ?? throw new KeyNotFoundException("Projeto não encontrado.");

        var isMember = await _context.ProjectMembers.AnyAsync(pm =>
            pm.ProjectId == request.Dto.ProjectId && pm.UserId == request.UserId, cancellationToken);

        if (!isMember)
            throw new UnauthorizedAccessException("Você não tem acesso a este projeto.");

        var task = new DomainTask
        {
            ProjectId = request.Dto.ProjectId,
            Title = request.Dto.Title,
            Description = request.Dto.Description,
            Status = request.Dto.Status,
            Priority = request.Dto.Priority,
            AssignedToId = request.Dto.AssignedToId,
            CreatedById = request.UserId,
            DueDate = request.Dto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(cancellationToken);

        return new TaskDto
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            ProjectName = project.Name,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            AssignedToId = task.AssignedToId,
            CreatedById = task.CreatedById,
            DueDate = task.DueDate,
            CreatedAt = task.CreatedAt,
            SubtaskCount = 0,
            CommentCount = 0
        };
    }
}

public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, TaskDto>
{
    private readonly AppDbContext _context;

    public UpdateTaskCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TaskDto> Handle(UpdateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Tarefa não encontrada.");

        var isMember = await _context.ProjectMembers.AnyAsync(pm =>
            pm.ProjectId == task.ProjectId && pm.UserId == request.UserId, cancellationToken);

        if (!isMember)
            throw new UnauthorizedAccessException("Você não tem acesso a este projeto.");

        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.AssignedToId = request.AssignedToId;
        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var project = await _context.Projects.FindAsync([task.ProjectId], cancellationToken);

        return new TaskDto
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            ProjectName = project?.Name ?? string.Empty,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            AssignedToId = task.AssignedToId,
            CreatedById = task.CreatedById,
            DueDate = task.DueDate,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            SubtaskCount = await _context.Subtasks.CountAsync(s => s.TaskId == task.Id, cancellationToken),
            CommentCount = await _context.Comments.CountAsync(c => c.TaskId == task.Id, cancellationToken)
        };
    }
}

public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand, bool>
{
    private readonly AppDbContext _context;

    public DeleteTaskCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.Tasks.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Tarefa não encontrada.");

        var isMember = await _context.ProjectMembers.AnyAsync(pm =>
            pm.ProjectId == task.ProjectId && pm.UserId == request.UserId, cancellationToken);

        if (!isMember)
            throw new UnauthorizedAccessException("Você não tem acesso a este projeto.");

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
