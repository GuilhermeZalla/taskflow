namespace TaskFlow.Application.DTOs;

/// <summary>
/// DTO for user login.
/// </summary>
public class LoginDto
{
    /// <summary>
    /// Email address of the user.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password for the user account.
    /// </summary>
    public string Password { get; set; } = string.Empty;
}