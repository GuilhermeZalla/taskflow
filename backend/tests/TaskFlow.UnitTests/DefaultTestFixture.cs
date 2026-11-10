namespace TaskFlow.UnitTests;

using MediatR;
using Microsoft.AspNetCore.Identity;
using TaskFlow.Application.Authentication.Commands;
using TaskFlow.Application.DTOs;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Persistence;

/// <summary>
/// Fixture base para testes unitários.
/// Configura banco de dados em memória e serviços necessários.
/// </summary>
public class DefaultTestFixture : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMediator _mediator;
    private readonly UserManager<ApplicationUser> _userManager;

    public DefaultTestFixture()
    {
        // Configure in-memory database for testing
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        // Configure UserManager
        var store = new UserStore<ApplicationUser>(_context);
        _userManager = new UserManager<ApplicationUser>(store, null!, new PasswordHasher<ApplicationUser>(), new[] { new EmailValidator<ApplicationUser>() }, new[] { new UpperInvariantLookupNormalizer() }, new PasswordValidator<ApplicationUser>
        {
            RequiredLength = 8,
            RequireDigit = true,
            RequireLowercase = true,
            RequireUppercase = true,
            RequireNonAlphanumeric = false
        }, new UpperInvariantLookupNormalizer());

        // Setup mediator
        var services = new ServiceCollection();
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(typeof(DefaultTestFixture).Assembly));
        var serviceProvider = services.BuildServiceProvider();

        _mediator = serviceProvider.GetRequiredService<IMediator>();
    }

    public async Task<TResponse> SendAsync<TRequest, TResponse>(TRequest request, CancellationToken cancellationToken = default) where TRequest : IRequest<TResponse>
    {
        return await _mediator.Send(request, cancellationToken);
    }

    public async Task SendAsync<TRequest>(TRequest request, CancellationToken cancellationToken = default) where TRequest : IRequest
    {
        await _mediator.Send(request, cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}