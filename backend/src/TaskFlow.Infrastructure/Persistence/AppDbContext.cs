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
    public DbSet<Domain.Entities.Task> Tasks { get; set; } = null!;
    public DbSet<Subtask> Subtasks { get; set; } = null!;
    public DbSet<Comment> Comments { get; set; } = null!;
    public DbSet<Activity> Activities { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<Label> Labels { get; set; } = null!;
    public DbSet<TaskLabel> TaskLabels { get; set; } = null!;
    public DbSet<TaskDependency> TaskDependencies { get; set; } = null!;
    public DbSet<CommentMention> CommentMentions { get; set; } = null!;
    public DbSet<ProjectTemplate> ProjectTemplates { get; set; } = null!;
    public DbSet<ProjectTemplateTask> ProjectTemplateTasks { get; set; } = null!;

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

        // ProjectMember
        builder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(pm => pm.Id);
            entity.Property(pm => pm.Role).IsRequired().HasMaxLength(50);
            entity.Property(pm => pm.JoinedAt).IsRequired();
            entity.HasOne(pm => pm.Project)
                  .WithMany(p => p.Members)
                  .HasForeignKey(pm => pm.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(pm => new { pm.ProjectId, pm.UserId }).IsUnique();
        });

        // Task
        builder.Entity<Domain.Entities.Task>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Title).IsRequired().HasMaxLength(200);
            entity.Property(t => t.Description).HasMaxLength(1000);
            entity.Property(t => t.Status).IsRequired().HasMaxLength(50);
            entity.Property(t => t.Priority).IsRequired().HasMaxLength(50);
            entity.Property(t => t.CreatedAt).IsRequired();
            entity.Property(t => t.ReminderSentAt);
            entity.HasOne(t => t.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(t => t.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Subtask
        builder.Entity<Subtask>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Title).IsRequired().HasMaxLength(200);
            entity.Property(s => s.IsCompleted).IsRequired();
            entity.Property(s => s.CreatedAt).IsRequired();
            entity.HasOne(s => s.Task)
                  .WithMany(t => t.Subtasks)
                  .HasForeignKey(s => s.TaskId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Comment
        builder.Entity<Comment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Content).IsRequired().HasMaxLength(2000);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.HasOne(c => c.Task)
                  .WithMany(t => t.Comments)
                  .HasForeignKey(c => c.TaskId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CommentMention>(entity =>
        {
            entity.HasKey(mention => mention.Id);
            entity.HasIndex(mention => new { mention.CommentId, mention.UserId }).IsUnique();
            entity.HasOne(mention => mention.Comment)
                .WithMany(comment => comment.Mentions)
                .HasForeignKey(mention => mention.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Activity
        builder.Entity<Activity>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.EntityType).IsRequired().HasMaxLength(50);
            entity.Property(a => a.EntityName).IsRequired().HasMaxLength(200);
            entity.Property(a => a.Action).IsRequired().HasMaxLength(50);
            entity.Property(a => a.CreatedAt).IsRequired();
            entity.HasOne(a => a.Workspace)
                .WithMany()
                .HasForeignKey(a => a.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Project)
                .WithMany()
                .HasForeignKey(a => a.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(a => a.Task)
                .WithMany()
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(a => new { a.WorkspaceId, a.CreatedAt });
        });

        // Notification
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Title).IsRequired().HasMaxLength(200);
            entity.Property(n => n.Message).IsRequired().HasMaxLength(1000);
            entity.Property(n => n.Type).IsRequired().HasMaxLength(40);
            entity.Property(n => n.IsRead).IsRequired();
            entity.Property(n => n.CreatedAt).IsRequired();
            entity.HasOne<Workspace>()
                .WithMany()
                .HasForeignKey(n => n.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
        });

        builder.Entity<Label>(entity =>
        {
            entity.HasKey(label => label.Id);
            entity.Property(label => label.Name).IsRequired().HasMaxLength(50);
            entity.Property(label => label.Color).IsRequired().HasMaxLength(7);
            entity.HasIndex(label => new { label.WorkspaceId, label.Name }).IsUnique();
            entity.HasOne(label => label.Workspace)
                .WithMany()
                .HasForeignKey(label => label.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TaskLabel>(entity =>
        {
            entity.HasKey(link => new { link.TaskId, link.LabelId });
            entity.HasOne(link => link.Task)
                .WithMany(task => task.Labels)
                .HasForeignKey(link => link.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(link => link.Label)
                .WithMany(label => label.Tasks)
                .HasForeignKey(link => link.LabelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TaskDependency>(entity =>
        {
            entity.HasKey(dependency => new { dependency.TaskId, dependency.DependsOnTaskId });
            entity.HasOne(dependency => dependency.Task)
                .WithMany(task => task.Dependencies)
                .HasForeignKey(dependency => dependency.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(dependency => dependency.DependsOnTask)
                .WithMany(task => task.Dependents)
                .HasForeignKey(dependency => dependency.DependsOnTaskId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(dependency => dependency.DependsOnTaskId);
        });

        builder.Entity<ProjectTemplate>(entity =>
        {
            entity.HasKey(template => template.Id);
            entity.Property(template => template.Name).IsRequired().HasMaxLength(100);
            entity.Property(template => template.Description).HasMaxLength(500);
            entity.HasOne(template => template.Workspace)
                .WithMany()
                .HasForeignKey(template => template.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProjectTemplateTask>(entity =>
        {
            entity.HasKey(task => task.Id);
            entity.Property(task => task.Title).IsRequired().HasMaxLength(200);
            entity.Property(task => task.Description).HasMaxLength(1000);
            entity.Property(task => task.Priority).IsRequired().HasMaxLength(50);
            entity.HasOne(task => task.Template)
                .WithMany(template => template.Tasks)
                .HasForeignKey(task => task.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
