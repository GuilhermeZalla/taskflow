using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Commands.Projects;
using TaskFlow.Application.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Handlers.Projects;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly AppDbContext _context;

    public CreateProjectCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var workspace = await _context.Workspaces.FindAsync([request.Dto.WorkspaceId], cancellationToken)
            ?? throw new KeyNotFoundException("Workspace não encontrado.");

        var workspaceRole = await _context.WorkspaceMembers
            .Where(member => member.WorkspaceId == request.Dto.WorkspaceId && member.UserId == request.UserId)
            .Select(member => member.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (workspaceRole is not ("Owner" or "Manager"))
            throw new UnauthorizedAccessException("Apenas proprietários e gerentes podem criar projetos.");

        var project = new Project
        {
            WorkspaceId = request.Dto.WorkspaceId,
            Name = request.Dto.Name,
            Description = request.Dto.Description,
            Status = request.Dto.Status,
            StartDate = request.Dto.StartDate,
            DueDate = request.Dto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);

        var workspaceMembers = await _context.WorkspaceMembers
            .Where(member => member.WorkspaceId == workspace.Id)
            .Select(member => new { member.UserId, member.Role })
            .ToListAsync(cancellationToken);
        if (workspaceMembers.All(member => member.UserId != request.UserId))
        {
            workspaceMembers.Add(new { UserId = request.UserId, Role = "Owner" });
        }

        _context.ProjectMembers.AddRange(workspaceMembers.Select(member => new ProjectMember
        {
            ProjectId = project.Id,
            UserId = member.UserId,
            Role = member.Role,
            JoinedAt = DateTime.UtcNow
        }));
        await _context.SaveChangesAsync(cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            WorkspaceId = project.WorkspaceId,
            WorkspaceName = workspace.Name,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            StartDate = project.StartDate,
            DueDate = project.DueDate,
            CreatedAt = project.CreatedAt,
            MemberCount = workspaceMembers.Count,
            TaskCount = 0
        };
    }
}

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly AppDbContext _context;

    public UpdateProjectCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Projeto não encontrado.");

        var role = await _context.ProjectMembers
            .Where(member => member.ProjectId == request.Id && member.UserId == request.UserId)
            .Select(member => member.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (role is not ("Owner" or "Manager"))
            throw new UnauthorizedAccessException("Apenas proprietários e gerentes podem editar projetos.");

        project.Name = request.Name;
        project.Description = request.Description;
        project.Status = request.Status;
        project.StartDate = request.StartDate;
        project.DueDate = request.DueDate;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var workspace = await _context.Workspaces.FindAsync([project.WorkspaceId], cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            WorkspaceId = project.WorkspaceId,
            WorkspaceName = workspace?.Name ?? string.Empty,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            StartDate = project.StartDate,
            DueDate = project.DueDate,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            MemberCount = await _context.ProjectMembers.CountAsync(pm => pm.ProjectId == project.Id, cancellationToken),
            TaskCount = await _context.Tasks.CountAsync(t => t.ProjectId == project.Id, cancellationToken)
        };
    }
}

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, bool>
{
    private readonly AppDbContext _context;

    public DeleteProjectCommandHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _context.Projects.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Projeto não encontrado.");

        var canDelete = await _context.ProjectMembers.AnyAsync(member =>
            member.ProjectId == request.Id && member.UserId == request.UserId &&
            (member.Role == "Owner" || member.Role == "Manager"), cancellationToken);

        if (!canDelete)
            throw new UnauthorizedAccessException("Apenas proprietários e gerentes podem excluir projetos.");

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
