using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.Authentication;
using TaskFlow.Application.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.API.Workspaces;

/// <summary>
/// Controlador para gerenciamento de workspaces.
/// </summary>
[ApiController]
[Route("api/workspaces")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorkspacesController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Obtém todos os workspaces do usuário autenticado.
    /// </summary>
    [HttpGet]
    public IActionResult GetAll()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workspaces = _context.Workspaces
            .Where(w => w.OwnerId == Guid.Parse(userId) || 
                       _context.WorkspaceMembers.Any(wm => wm.WorkspaceId == w.Id && wm.UserId == Guid.Parse(userId)))
            .Select(w => new
            {
                w.Id,
                w.Name,
                w.Description,
                OwnerName = w.Owner?.FullName,
                MemberCount = _context.WorkspaceMembers.Count(wm => wm.WorkspaceId == w.Id)
            })
            .ToList();

        return Ok(workspaces);
    }

    /// <summary>
    /// Cria um novo workspace.
    /// </summary>
    [HttpPost]
    public IActionResult Create([FromBody] string name)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workspace = new Workspace
        {
            Name = name,
            OwnerId = Guid.Parse(userId),
            CreatedAt = DateTime.UtcNow
        };

        _context.Workspaces.Add(workspace);
        
        // Adiciona o criador como owner/membro
        var member = new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = Guid.Parse(userId),
            Role = "Owner",
            JoinedAt = DateTime.UtcNow
        };
        
        _context.WorkspaceMembers.Add(member);
        _context.SaveChanges();

        return Created($"/api/workspaces/{workspace.Id}", new
        {
            workspace.Id,
            workspace.Name,
            workspace.Description,
            workspace.CreatedAt
        });
    }

    /// <summary>
    /// Obtém um workspace específico por ID.
    /// </summary>
    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workspace = _context.Workspaces
            .Where(w => w.Id == id && 
                       (w.OwnerId == Guid.Parse(userId) || 
                        _context.WorkspaceMembers.Any(wm => wm.WorkspaceId == id && wm.UserId == Guid.Parse(userId))))
            .Select(w => new
            {
                w.Id,
                w.Name,
                w.Description,
                w.OwnerId,
                CreatedAt = w.CreatedAt,
                MemberCount = _context.WorkspaceMembers.Count(wm => wm.WorkspaceId == w.Id)
            })
            .FirstOrDefault();

        if (workspace == null)
        {
            return NotFound();
        }

        return Ok(workspace);
    }
}