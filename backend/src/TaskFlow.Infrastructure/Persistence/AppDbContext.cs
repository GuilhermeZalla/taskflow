using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence;

/// <summary>
/// Contexto do Entity Framework Core para a aplicação TaskFlow.
/// Configura as entidades de domínio e o esquema de identidade.
/// </summary>
public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // DbSets de domínio
    public DbSet<Workspace> Workspaces { get; set; } = null!;
    public DbSet<WorkspaceMember> WorkspaceMembers { get; set; } = null!;
    public DbSet<Project> Projects { get; set; } = null!;
    public DbSet<ProjectMember> ProjectMembers { get; set; } = null!;
    public DbSet<Task> Tasks { get; set; } = null!;
    public DbSet<Subtask> Subtasks { get; set; } = null!;
    public DbSet<Comment> Comments { get; set; } = null!;
    public DbSet<Activity> Activities { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configurações de tabelas de identidade
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            entity.Property(u => u.CreatedAt).IsRequired();
        });

        // Configurações de entidades de domínio

        // Workspace
        builder.Entity<Workspace>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Name).IsRequired().HasMaxLength(200);
            entity.Property(w => w.Description).HasMaxLength(500);
            entity.Property(w => w.CreatedAt).IsRequired();
            entity.HasOne(w => w.Owner)
                  .WithMany()
                  .HasForeignKey(w => w.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // WorkspaceMember
        builder.Entity<WorkspaceMember>(entity =>
        {
            entity.HasKey(wm => wm.Id);
            entity.Property(wm => wm.Role).IsRequired().HasMaxLength(50);
            entity.Property(wm => wm.JoinedAt).IsRequired();
            entity.HasOne(wm => wm.Workspace)
                  .WithMany(w => w.Members)
                  .HasForeignKey(wm => wm.WorkspaceId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(wm => wm.User)
                  .WithMany()
                  .HasForeignKey(wm => wm.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(wm => new { wm.WorkspaceId, wm.UserId }).IsUnique();
        });

        // Project
        builder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Description).HasMaxLength(500);
            entity.Property(p => p.Status).IsRequired().HasMaxLength(50);
            entity.Property(p => p.CreatedAt).IsRequired();
            entity.HasOne(p => p.Workspace)
                  .WithMany()
                  .HasForeignKey(p => p.WorkspaceId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ProjectMembernio
        builder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.CreatedAt).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
        });
    }
}