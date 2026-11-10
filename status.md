# Status do Projeto TaskFlow

## Visão Geral
Este documento registra o progresso, pendências e decisões tomadas durante a implementação do TaskFlow.

## Fase Atual: 1 - Configuração Inicial e Fundação Técnica

### ✅ Concluído
- Inspeção do ambiente de desenvolvimento (.NET SDK 11, Node.js 24, Docker 29)
- Criação da estrutura de pastas do repositório
- Criação da solução .NET e 4 projetos de backend (Domain, Application, Infrastructure, API)
- Referências entre projetos configuradas
- Pacotes NuGet instalados (EF Core, Npgsql, Identity, FluentValidation, OpenApi, JwtBearer, HealthChecks)
- Build da solução .NET bem-sucedido

### ✅ Concluído
- Inspeção do ambiente de desenvolvimento (.NET SDK 11, Node.js 24, Docker 29)
- Criação da estrutura de pastas do repositório
- Criação da solução .NET e 4 projetos de backend (Domain, Application, Infrastructure, API)
- Referências entre projetos configuradas
- Pacotes NuGet instalados (EF Core, Npgsql, Identity, FluentValidation, OpenApi, JwtBearer, HealthChecks)
- Build da solução .NET bem-sucedido
- Código de fundação da API (Program.cs com DI, CORS, Auth, EF Core, Health Checks)
- appsettings.json e appsettings.Development.json com ConnectionStrings e JwtSettings
- Domain: Entidade User pura (sem dependência de Identity)
- Infrastructure: ApplicationUser (IdentityUser), AppDbContext com configurações
- Endpoint de saúde GET /api/health e GET /api/health/db
- CORS configurado para React (localhost:5173)
- Autenticação JWT Bearer configurada
- ASP.NET Core Identity configurado com endpoints de API

### ✅ Concluído
- Inspeção do ambiente de desenvolvimento (.NET SDK 11, Node.js 24, Docker 29)
- Criação da estrutura de pastas do repositório
- Criação da solução .NET e 4 projetos de backend (Domain, Application, Infrastructure, API)
- Referências entre projetos configuradas
- Pacotes NuGet instalados (EF Core, Npgsql, Identity, FluentValidation, OpenApi, JwtBearer, HealthChecks)
- Build da solução .NET bem-sucedido
- Código de fundação da API (Program.cs com DI, CORS, Auth, EF Core, Health Checks)
- appsettings.json e appsettings.Development.json com ConnectionStrings e JwtSettings
- Domain: Entidade User pura (sem dependência de Identity)
- Infrastructure: ApplicationUser (IdentityUser), AppDbContext com configurações
- Endpoint de saúde GET /api/health e GET /api/health/db
- CORS configurado para React (localhost:5173)
- Autenticação JWT Bearer configurada
- ASP.NET Core Identity configurado com endpoints de API
- Projetos de teste (Unit e Integration) criados e referenciados
- Docker Compose para PostgreSQL criado

### 🔄 Em Andamento
- Frontend: Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form, Zod

### ⏳ Pendente
- .gitignore e .env.example
- README.md inicial
- Build do frontend
- Execução de testes
- Validação do Docker Compose

### 📋 Decisões Técnicas
- Target Framework: .NET 10 (packages na versão 10.0.4 para compatibilidade com Npgsql 10.0.3)
- Arquitetura: Modular Monolith com Clean Architecture (pragmático)
- Banco de dados: PostgreSQL via Docker Compose
- Autenticação: ASP.NET Core Identity + JWT Bearer (preparação apenas)
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Solução no formato .slnx (novo formato da Microsoft)
