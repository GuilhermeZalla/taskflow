# TaskFlow 1.0.0

The first release of the web application for local use and presentation through GitHub. It does not include a native app or public hosting.

## Included

- Responsive interface in Portuguese and English, with fictional sample data in the browser demo.
- Authentication, workspaces, projects, and tasks through a C# API and MySQL.
- Teams, comments with mentions, in-app notifications, labels, dependencies, and project templates.
- Calendar, activity history, reports, and CSV export.
- README with setup instructions, screenshots, and demos; standalone PDF project presentation.

## Verification

- 26 frontend tests and the production build passed.
- 5 API unit tests and 4 HTTP tests passed; the HTTP tests use EF Core InMemory.
- Local API health checks returned HTTP 200, including a `Healthy` MySQL connection.
- Eight internal routes were checked at widths of 390, 768, and 1440 px, with no horizontal scrolling.

## Known limitations

- The HTTP test run does not replace full regression testing of read and write flows against real MySQL. Use disposable data before trusting the application with personal data.
- On the development machine, API tests used `DOTNET_ROLL_FORWARD=Major` because the ASP.NET Core 10 runtime was missing. For standard execution, install the ASP.NET Core 10 runtime.
- Account confirmation and recovery by email, email invitations, and external notifications have been postponed to version 1.1.
- A future online deployment requires HTTPS, secure secrets, logs, backup and restore procedures, and a review of the MediatR 14.3.0 production license.

See the [README](../README.md) for setup and run instructions. See [status.md](../status.md) for technical progress and remaining work.
