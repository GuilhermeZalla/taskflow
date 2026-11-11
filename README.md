# TaskFlow

Portal de gerenciamento de projetos e tarefas (MVP em evolução).

## Stack
- **Backend:** .NET 10 Web API, Clean Architecture, EF Core, Identity/JWT, MediatR, FluentValidation, PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS, React Query, Axios

## Estrutura
- ackend/src/TaskFlow.Domain - entidades de domínio
- ackend/src/TaskFlow.Application - DTOs, commands, validators
- ackend/src/TaskFlow.Infrastructure - EF Core AppDbContext, Identity (ApplicationUser)
- ackend/src/TaskFlow.API - controllers, handlers MediatR, endpoints
- ackend/tests - projetos de testes (unit/integration)
- rontend - aplicação React

## Endpoints Principais (API)
- Auth/Health: /api/identity/*, /api/auth/me, /api/health, /api/health/db
- Workspaces: GET/POST /api/workspaces, GET/PUT/DELETE /api/workspaces/{id}
- Projects: GET/POST /api/projects (filtro workspaceId), GET/PUT/DELETE /api/projects/{id}
- Tasks: GET/POST /api/tasks (filtro projectId), GET/PUT/DELETE /api/tasks/{id}

## Execução (desenvolvimento)
### Backend
`powershell
dotnet build backend/src/TaskFlow.API/TaskFlow.API.csproj
dotnet run --project backend/src/TaskFlow.API/TaskFlow.API.csproj
`

### Frontend
`powershell
cd frontend
npm install
npm run dev
`

### Banco de dados
- docker-compose.yml disponível para PostgreSQL.
- Connection string e JWT em ackend/src/TaskFlow.API/appsettings*.json / .env.example.

## Status
Consulte status.md para o estado atual, entregas da última fase e pendências (incluindo reescrita da suíte de testes).
