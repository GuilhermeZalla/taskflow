namespace TaskFlow.UnitTests;

using TaskFlow.Domain.Entities;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Authentication;
using FluentValidation.Results;

/// <summary>
/// Unit tests for authentication functionality.
/// </summary>
public class AuthUnitTests
{
    private readonly DefaultTestFixture _fixture;

    public AuthUnitTests()
    {
        _fixture = new DefaultTestFixture();
    }

    [Fact]
    public async Task Register_ValidData_ShouldSucceed()
    {
        // Arrange
        var command = new RegisterCommand
        {
            RegisterDto = new RegisterDto
            {
                FullName = "John Doe",
                Email = "john@example.com",
                Password = "StrongPassword123!",
                PasswordConfirmation = "StrongPassword123!"
            }
        };

        // Act
        var result = await _fixture.SendAsync(command);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("john@example.com", result.Email);
        Assert.Equal("John Doe", result.FullName);
        Assert.NotNull(result.AccessToken);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ShouldFail()
    {
        // Arrange
        var command1 = new RegisterCommand
        {
            RegisterDto = new RegisterDto
            {
                FullName = "John Doe",
                Email = "john@example.com",
                Password = "StrongPassword123!",
                PasswordConfirmation = "StrongPassword123!"
            }
        };

        var command2 = new RegisterCommand
        {
            RegisterDto = new RegisterDto
            {
                FullName = "John Duplicate",
                Email = "john@example.com", // Same email
                Password = "StrongPassword123!",
                PasswordConfirmation = "StrongPassword123!"
            }
        };

        // Act - Register first user
        await _fixture.SendAsync(command1);

        // Assert - Second registration should fail
        var exception = await Assert.ThrowsAsync<ApplicationException>(() =>
            _fixture.SendAsync(command2));

        Assert.Contains("já existe", exception.Message);
    }

    [Fact]
    public async Task Register_InvalidPassword_ShouldFail()
    {
        // Arrange
        var command = new RegisterCommand
        {
            RegisterDto = new RegisterDto
            {
                FullName = "John Doe",
                Email = "john@example.com",
                Password = "weak", // Too short
                PasswordConfirmation = "weak"
            }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ApplicationException>(() =>
            _fixture.SendAsync(command));

        Assert.Contains("senha", exception.Message);
    }

    [Fact]
    public async Task Login_ValidCredentials_ShouldSucceed()
    {
        // Arrange - Register user first
        await _fixture.SendAsync(new RegisterCommand
        {
            RegisterDto = new RegisterDto
            {
                FullName = "John Doe",
                Email = "john.test@example.com",
                Password = "StrongPassword123!",
                PasswordConfirmation = "StrongPassword123!"
            }
        });

        // Act
        var result = await _fixture.SendAsync(new LoginCommand
        {
            LoginDto = new LoginDto
            {
                Email = "john.test@example.com",
                Password = "StrongPassword123!"
            }
        });

        // Assert
        Assert.NotNull(result.AccessToken);
        Assert.Equal("john.test@example.com", result.Email);
        Assert.Equal("John Doe", result.FullName);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ShouldFail()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ApplicationException>(() =>
            _fixture.SendAsync(new LoginCommand
            {
                LoginDto = new LoginDto
                {
                    Email = "john.test@example.com",
                    Password = "WrongPassword!"
                }
            }));

        Assert.Contains("credenciais", exception.Message);
    }

    [Fact]
    public async Task Login_NonExistentUser_ShouldFail()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ApplicationException>(() =>
            _fixture.SendAsync(new LoginCommand
            {
                LoginDto = new LoginDto
                {
                    Email = "nonexistent@example.com",
                    Password = "Password123!"
                }
            }));

        Assert.Contains("credenciais", exception.Message);
    }
}