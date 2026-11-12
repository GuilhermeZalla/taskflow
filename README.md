# TaskFlow

Aplicação de gerenciamento colaborativo de projetos e tarefas.

## Stack

- Backend: ASP.NET Core 10, EF Core 10, ASP.NET Identity, MySQL 8.0+
- Frontend: React, TypeScript, Vite, Tailwind CSS e React Query

## Estrutura

- `backend/src/TaskFlow.Domain`: entidades
- `backend/src/TaskFlow.Application`: comandos, DTOs e validação
- `backend/src/TaskFlow.Infrastructure`: EF Core, Identity e migrations MySQL
- `backend/src/TaskFlow.API`: endpoints e configuração da aplicação
- `backend/tests`: testes unitários e de integração
- `frontend`: interface React

## Executar localmente

1. Copie `.env.example` para `.env` na raiz e defina senhas seguras para `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`.
2. Inicie o banco com `docker compose up -d mysql`.
3. Na pasta do backend, configure a conexão da API usando o mesmo valor de `MYSQL_PASSWORD` definido no `.env` e aplique o esquema:

   ```powershell
   $env:ConnectionStrings__DefaultConnection = "Server=localhost;Port=3307;Database=TaskFlowDb;User ID=taskflow;Password=SUA_SENHA_MYSQL;"
   dotnet ef database update --project src/TaskFlow.Infrastructure --startup-project src/TaskFlow.API
   dotnet run --project src/TaskFlow.API
   ```

4. Em outro terminal, execute `cd frontend`, `npm install` e `npm run dev`.

O perfil local da API também tem uma conexão MySQL de desenvolvimento em `appsettings.Development.json`. Para sobrescrevê-la, configure `ConnectionStrings__DefaultConnection` no ambiente.

## Testes

```powershell
dotnet test backend/TaskFlow.slnx
cd frontend
npm test
npm run build
```

Veja [status.md](status.md) para entregas e pendências atuais.
