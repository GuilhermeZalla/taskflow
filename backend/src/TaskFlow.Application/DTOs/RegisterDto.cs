namespace TaskFlow.Application.DTOs;

/// <summary>
/// DTO for user registration.
/// </summary>
public class RegisterDto
{
    /// <summary>
    /// Full name of the user.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the user (must be unique).
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password for the user account.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Confirmation of the password.
    /// </summary>
    public string PasswordConfirmation { get; set; } = string.Empty;
}