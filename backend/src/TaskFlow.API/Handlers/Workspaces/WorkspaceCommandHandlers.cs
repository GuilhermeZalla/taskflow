using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Commands.Workspaces;
using TaskFlow.Application.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Handlers.Workspaces;

public class CreateWorkspaceCommandHandler : IRequestHandler<CreateWorkspaceCommand, WorkspaceDto>
{
    private readonly AppDbContext _context;

    public CreateWorkspaceCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<WorkspaceDto> Handle(CreateWorkspaceCommand request, CancellationToken cancellationToken)
    {
        var workspace = new Workspace
        {
            Name = request.Dto.Name,
            Description = request.Dto.Description,
            OwnerId = request.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);

        var member = new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = request.UserId,
            Role = "Owner",
            JoinedAt = DateTime.UtcNow
        };

        _context.WorkspaceMembers.Add(member);
        await _context.SaveChangesAsync(cancellationToken);

        return new WorkspaceDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Description = workspace.Description,
            OwnerId = workspace.OwnerId,
            CreatedAt = workspace.CreatedAt,
            MemberCount = 1
        };
    }
}

public class UpdateWorkspaceCommandHandler : IRequestHandler<UpdateWorkspaceCommand, WorkspaceDto>
{
    private readonly AppDbContext _context;

    public UpdateWorkspaceCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<WorkspaceDto> Handle(UpdateWorkspaceCommand request, CancellationToken cancellationToken)
    {
        var workspace = await _context.Workspaces.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Workspace não encontrado.");

        if (workspace.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("Você não é o proprietário deste workspace.");

        workspace.Name = request.Name;
        workspace.Description = request.Description;
        workspace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new WorkspaceDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Description = workspace.Description,
            OwnerId = workspace.OwnerId,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt,
            MemberCount = await _context.WorkspaceMembers.CountAsync(wm => wm.WorkspaceId == workspace.Id, cancellationToken)
        };
    }
}

public class DeleteWorkspaceCommandHandler : IRequestHandler<DeleteWorkspaceCommand, bool>
{
    private readonly AppDbContext _context;

    public DeleteWorkspaceCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteWorkspaceCommand request, CancellationToken cancellationToken)
    {
        var workspace = await _context.Workspaces.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Workspace não encontrado.");

        if (workspace.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("Você não é o proprietário deste workspace.");

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
