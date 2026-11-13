namespace TaskFlow.Domain.Entities;

public sealed class EmailOutboxMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string ProtectedHtmlBody { get; set; } = string.Empty;
    public string ProtectedTextBody { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public int AttemptCount { get; set; }
    public string? LastErrorCode { get; set; }
}
