# TaskFlow — Status atual (12/11/2026)

## Rodada de fechamento da 1.0 — 12/11/2026

- Frontend: 26 testes aprovados, tipos aprovados e build de produção aprovado (Vite 8.3.7). A interface foi conferida em 8 rotas internas nas larguras de 390, 768 e 1440 px: páginas carregaram sem rolagem horizontal. O contraste do botão **Menu** no celular foi corrigido e a navegação aberta foi verificada visualmente.
- Backend: testes da solução aprovados com `DOTNET_ROLL_FORWARD=Major` (5 unitários e 4 de integração HTTP). Dois testes de fluxo foram adicionados para permissões, membros, comentários/menções, notificações, etiquetas, dependências e modelos de projeto. A integração HTTP usa EF Core InMemory e não prova o comportamento das mesmas operações no MySQL.
- API local iniciada com a configuração já existente: `/api/health` e `/api/health/db` responderam HTTP 200; o check do MySQL informou `Healthy`. Nenhum registro de usuário ou tarefa foi criado no banco real nesta rodada.
- **Escopo decidido pelo titular:** 1.0 para GitHub e execução local. E-mails de confirmação/recuperação, convites e notificações externas ficam para a 1.1. Hospedagem pública e operação de produção não fazem parte desta entrega.
- **Limitação antes de usar com dados reais:** falta uma regressão funcional de escrita/leitura no MySQL com dados descartáveis. O health check confirma conexão, não todos os fluxos. MediatR 14.3.0 emite aviso de licença ausente; conferir a licença antes de um deploy de produção.
- Versão do frontend alinhada para `1.0.0`. Os 974 artefatos gerados de `bin/obj` foram removidos apenas do controle de versão e ignorados; permanecem no disco local. Commit `fa261e5`, tag `v1.0.0` e página de Release publicados no GitHub.
- A máquina possui runtime `Microsoft.NETCore.App` 10, mas apenas `Microsoft.AspNetCore.App` 11. Os testes da API usaram roll-forward para 11; o ambiente final precisa do runtime ASP.NET Core 10 ou de uma decisão explícita de atualização.
- Confirmação/recuperação de conta, convites por e-mail e notificações externas foram adiados para a 1.1. A gestão de participantes cadastrados e as notificações internas estão implementadas.

## Entrega dos pontos 1 a 6

- **1. Backend e autenticação:** ASP.NET Identity, EF Core 10.0.12 e MySQL 8.0 pelo provedor oficial `MySql.EntityFrameworkCore` 10.0.12. Registro/login, perfil, validação e migrations incluídos.
- **Banco local:** `TaskFlowDb` criado no MySQL 8.0 da porta 3307; usuário `taskflow` com permissões somente nesse banco. Migration `20261112031633_InitialMySql` aplicada e confirmada no histórico do EF Core. Segredo guardado no `.env` local, ignorado pelo Git.
- **API local:** iniciada em `http://127.0.0.1:5080`. `/api/health` retornou `healthy` e `/api/health/db` retornou `Healthy` com a conexão MySQL real.
- **2. Equipes e atividade:** gestão autenticada de participantes cadastrados e histórico de eventos reais.
- **3. Comentários e menções:** comentários em tarefas, menções validadas no espaço e notificações correspondentes.
- **4. Notificações e lembretes:** central no cabeçalho, leitura individual/em lote e lembretes no app antes do prazo.
- **5. Relatórios:** filtros por espaço, projeto e intervalo de prazo, com exportação CSV.
- **6. Organização:** etiquetas, dependências com bloqueio de ciclos/pré-requisitos e modelos de projeto com cópia das tarefas.

## Validação e pendências

- `dotnet build backend/TaskFlow.slnx --no-restore`: aprovado, 0 avisos/erros.
- `dotnet test backend/TaskFlow.slnx --no-restore`: 9 aprovados (5 unitários, 4 HTTP/in-memory). Neste computador foi usado `DOTNET_ROLL_FORWARD=Major` devido à ausência do runtime ASP.NET Core 10.
- `npm test --prefix frontend`: 26 aprovados; `npm run build --prefix frontend`: aprovado.
- Nenhum pacote vulnerável reportado para a API.
- A migration e os health checks foram verificados no MySQL local. Os testes HTTP cobrem fluxos centrais de colaboração e planejamento em memória; testar todos esses fluxos contra o MySQL continua pendente.
- E-mails e notificações externas são escopo da 1.1. Deploy online é um projeto posterior. A versão local 1.0.0 foi publicada no GitHub.

## Próximos passos

1. Testar cadastro/login e os fluxos de equipes, comentários, notificações, relatórios, etiquetas, dependências e modelos usando a API local e o banco recém-criado.
2. Validar com dados descartáveis a escrita/leitura integrada no MySQL antes de confiar dados reais à aplicação.
3. Conferir a instalação local a partir da tag `v1.0.0` em um ambiente limpo.
4. Para uma futura hospedagem pública: definir servidor/domínio, HTTPS, segredos, logs, backup/restauração, runtime ASP.NET Core 10 e licença do MediatR.
5. Para a 1.1: definir e implementar e-mails de conta, convites e eventual notificação externa.

## Pendências para a versão 1.0

- [ ] Validar os fluxos completos integrados ao MySQL: cadastro, login, equipes, comentários/menções, notificações, relatórios/exportação e recursos de organização.
- [x] Reexecutar build e testes do frontend após as alterações visuais recentes e corrigir falhas encontradas.
- [x] Conferir as 8 rotas internas em desktop, tablet e celular, sem rolagem horizontal; corrigir o contraste do menu móvel.
- [x] Definir e-mails e notificações externas para a 1.1; manter as notificações internas funcionais.
- [x] Tirar artefatos `bin/obj` do controle de versão e alinhar o frontend para `1.0.0`.
- [x] Publicar a versão 1.0.0 no GitHub com número, tag e notas de versão.
- [x] Registrar o commit local da versão 1.0.
- [x] Publicar commit/tag no GitHub e conferir o resultado remoto.

## Após a versão local/GitHub

- [ ] Preparar produção com segredos seguros, banco/migrations, domínio e HTTPS, logs, backups e plano de recuperação.
- [ ] Conferir licença de produção do MediatR e instalar runtime ASP.NET Core 10 no servidor.
- [ ] Implementar e validar e-mails de conta, convites e eventual notificação externa na 1.1.
---
# TaskFlow - Status do Projeto

## Idiomas português e inglês — 11/11/2026

- Interface disponível em português e inglês nas páginas, navegação, formulários, filtros, mensagens e acessibilidade. O seletor aparece no login/cadastro, cabeçalho e Preferências; a escolha fica salva neste navegador e sincroniza entre abas.
- Alterar o idioma mantém o formulário e os valores internos das tarefas; datas são apresentadas conforme o idioma escolhido. O pedido HTTP inclui `Accept-Language`; a API ainda não foi alterada nem validada para traduzir suas próprias respostas.
- Conteúdo cadastrado pelo usuário não é traduzido automaticamente. Os registros pré-carregados da demonstração têm versões nos dois idiomas.
- `npm test`: 26 testes aprovados, incluindo testes do catálogo, persistência, sincronização, datas, mensagens de erro e exemplos bilíngues da demonstração.
- `npm run build`: TypeScript e compilação aprovados. Navegador: 136 combinações (17 rotas, 4 larguras e 2 idiomas), sem overflow horizontal nem erros JavaScript; troca de idioma preservando dados do formulário, login, enums de API, equipes e atividade verificadas.
- Capturas em inglês: visão geral, tarefas e calendário no desktop; tarefas e login no celular. Galeria completa das prévias permanece fora do repositório.

## Refinamento de demonstração, visão geral e celular — 11/11/2026

- Conteúdo de exemplo da demonstração aparece em português ou inglês conforme o idioma da interface, incluindo projetos, tarefas, espaços e descrições. A tradução é apenas de apresentação e não altera os dados guardados; conteúdo criado pelo usuário continua intacto.
- A visão geral usa colunas mais equilibradas em telas largas. No celular, a busca ocupa uma faixa própria, sem o botão duplicado de envio e sem o selo de demonstração na faixa superior.
- Validação final após os ajustes: 26 testes aprovados, TypeScript/build aprovados, `git diff --check` limpo. Capturas desktop da visão geral e celular das tarefas inspecionadas; sem overflow horizontal ou erros JavaScript nos dois tamanhos.
- Prévia atualizada em `taskflow-en-overview-refined.png` e `taskflow-en-mobile-refined.png`, na galeria externa ao repositório.

## Interface consolidada — 11/11/2026

- O titular autorizou continuar todas as páginas sem parar para aprovação individual. Estilo, paleta e fontes atuais preservados; nenhuma dependência adicionada.
- Conjunto da interface: Visão geral, Projetos, Tarefas (lista/quadro), Espaços, Equipes, Calendário, Atividade, Relatórios, Preferências, login/cadastro e formulários de criação/edição. Navegação desktop persistente, menu mobile recolhível, busca de tarefas no cabeçalho e preferências locais de densidade.
- Tarefas: busca e filtros combinados por projeto/status/prioridade, ordenação, edição de campos, mudança entre etapas, conclusão/reabertura, responsável na demonstração e exclusão confirmada. Estados e prioridades são normalizados; alterações invalidam os resumos e relatórios relacionados.
- Formulários reutilizáveis permitem criar/editar/excluir espaços, projetos e tarefas. Datas de início/prazo alimentam o calendário; vínculos de projeto/espaço ficam preservados ao editar. Datas enviadas em ISO com fuso explícito; prazos anteriores ao início do projeto são rejeitados no formulário. Atribuições existentes da API são preservadas quando a seleção de membros ainda não está disponível.
- Calendário: mês anterior/próximo/hoje, seleção de dia, filtro de projetos/tarefas, opção de incluir concluídos e links para editar cada entrega. Relatórios calculam conclusão, pendências, prazos vencidos e distribuição por responsáveis existentes, sem inventar horas ou produtividade.
- Equipes: cadastro/remoção de participantes e atribuição local na demonstração, sem envio de convites. Atividade registra apenas mutações realmente realizadas no adapter local; não reconstrói eventos antigos. Fora da demonstração, essas telas indicam integração pendente e não chamam endpoints inexistentes de membros ou histórico.
- Preferências: densidade persistida no navegador, dados de sessão e reinício confirmado dos exemplos locais. Os exemplos iniciais incluem datas relativas ao dia de abertura; dados antigos do navegador não são substituídos automaticamente. Reiniciar a demonstração é uma ação explícita do usuário.

### Verificação do conjunto
- `npm test`: 19 testes aprovados, incluindo filtros, normalização, calendário, datas vencidas, persistência, edição, histórico, validação de membros e exclusões locais em cascata.
- `npm run build`: aprovado, incluindo TypeScript. Nenhuma alteração de dependências ou backend nesta etapa.
- Navegador: 68 combinações de 17 rotas em 390/768/1024/1440 px, sem overflow horizontal ou erros JavaScript. Edição/prazo/responsável, calendário, relatórios, conclusão, participante/histórico e densidade persistida testados em conjunto.
- Conferências adicionais: erros de tarefa/participante, reset confirmado, navegação de meses, busca do cabeçalho e menu mobile. Em modo de API com respostas interceptadas, Equipes e Atividade mantiveram a indicação de pendência sem enviar requisições aos endpoints que não existem.
- Capturas finais: 13 desktop e 3 mobile, mais galeria HTML independente fora do repositório. Dados fictícios em perfil isolado; o armazenamento do navegador do titular não foi alterado. Capturas inspecionadas e ajustes de formulários em janelas médias realizados.

### Situação da integração real
O layout e os fluxos da demonstração estão prontos para revisão. Autenticação/banco da API real, suíte .NET, runtime 10 e aviso do Microsoft.OpenApi continuam pendentes conforme os registros anteriores. Equipes/histórico precisam de endpoints reais e autorização; os testes de navegador não comprovam PostgreSQL ou envio de convites. Não houve migrations, criação de conta real, commit, push ou merge nesta etapa.

Arquivos principais: `features/work/` (dados e regras compartilhadas), telas em `features/tasks`, `workspaces`, `teams`, `calendar`, `activity`, `reports`, `settings`; `components/ui/EntityForm`, `Sidebar`, `Header`, `Layout`, `IntegrationNotice`; rotas, adapter de demonstração, estilos e testes.

## Evolução página a página — Projetos (11/11/2026)

- Segunda página concluída, mantendo cores, fontes e estrutura visual aprovadas. Tabela de projetos no desktop e registros rotulados no celular, com descrição, espaço de trabalho, status, progresso calculado, início/prazo quando definidos e acesso às tarefas.
- Busca por nome/descrição sem distinção de acentos, filtros por espaço/status e ordenação por nome, prazo ou progresso. Filtros preservados na URL, com limpeza e estado vazio. Ajustada a atualização síncrona da URL para não perder caracteres durante digitação rápida.
- Percentuais derivados das tarefas reais recebidas; projetos sem tarefas mostram indicação explícita, sem inventar progresso ou datas. Concluir/excluir uma tarefa invalida também o cache da página de Projetos.
- Arquivos desta etapa: `features/projects/Projects.tsx`, `project-list.ts`, `project-list.test.mjs`, estilos específicos, comando de testes e uma invalidação de cache em `features/tasks/Tasks.tsx`.
- Validação: 12 testes automatizados (quatro novos de filtros/ordenação/progresso/datas), build/TypeScript e conferência de diferenças aprovados. Navegador em 390/768/1024/1440 px, sem overflow ou erros JavaScript; criação, digitação rápida, recarregamento com filtros, status, ordenação por prazo, espaço vazio e progresso após conclusão conferidos. Capturas reais com dados fictícios geradas fora do repositório; API/banco reais não foram validados por esses ensaios.
- Próxima página: Tarefas, com o mesmo padrão de prévias por etapa. Pendências backend e situação de Git abaixo continuam em aberto; sem commit ou push nesta etapa.

## Evolução página a página — Visão geral (11/11/2026)

- O titular aprovou manter o estilo e as cores atuais. O prompt colaborativo foi usado para aprimorar hierarquia, conteúdo útil e interações; paleta alternativa, fontes novas e troca da estrutura visual não foram aplicadas.
- Primeira página: Visão geral. Filtro por espaço de trabalho; indicadores de projetos ativos, total de tarefas, abertas e concluídas; próximas tarefas ordenadas por prioridade e prazo; progresso por projeto calculado das tarefas; prazos de projetos/tarefas ainda abertos. Removido texto promocional do rodapé em favor de informação de planejamento.
- Sem dados, a interface mostra estados vazios reais, sem gerar percentuais, prazos ou atividades fictícias. Datas exibidas nas capturas foram inseridas apenas no perfil isolado do navegador de teste e identificadas como demonstração; a API e o armazenamento do usuário não foram alterados.
- Validação: oito testes automatizados aprovados (quatro novos de escopo/progresso/prazos), build/TypeScript aprovados. Prévia conferida em 390/768/1024/1440 px, incluindo seleção de espaço vazio e retorno aos dados, sem overflow ou erros JavaScript. Capturas reais de desktop/celular/estado vazio geradas fora do repositório.
- Entrega por página, com prévia antes de avançar. Ordem proposta: Visão geral → Projetos → Tarefas → equipes/calendário/atividade/relatórios conforme os dados e endpoints disponíveis. Não adicionar navegação decorativa para recursos ainda sem fluxo funcional.
- Arquivos desta etapa: `frontend/src/features/dashboard/Home.tsx`, `overview.ts`, `overview.test.mjs`, estilos específicos em `frontend/src/styles/global.css` e comando de testes em `frontend/package.json`. Pendências backend e situação de Git registradas abaixo permanecem em aberto.

## Retomada atual — layout funcional (11/11/2026)

### Direção e entrega
- Interface de trabalho com base neutra quente, verde escuro moderado, tipografia do sistema, listas e divisores, cantos discretos e foco visível. Navegação adaptada ao celular, sem gradientes ou sombras ornamentais.
- Visão geral com contagens calculadas e tarefas/projetos; espaços e projetos em listas com navegação relacionada. Tarefas com busca, filtro de status, lista/quadro, conclusão/reabertura e exclusão com confirmação.
- Formulários de criação reutilizáveis; estados de carregamento, vazio, erro, envio e confirmação. Login/cadastro fora do shell autenticado, proteção de rotas e mostrar/ocultar senha. Endpoints do frontend corrigidos para `/login` e `/register`, conforme o Identity mapeado na raiz. Cadastro sem token não simula autenticação.
- Demonstração explicitamente identificada, ativada por **Explorar demonstração**. Dados fictícios persistem apenas neste navegador; não criam sessão real nem acessam o banco. Não é fallback silencioso da API. Nenhuma dependência adicionada.
- Arquivos principais: `frontend/src/styles/global.css`, componentes em `components/ui/`, telas em `features/`, rotas, serviços `api.ts`/`demo.ts` e testes `demo.test.mjs`. Arquivos que receberam somente formatação foram restaurados.

### Como avaliar
Em `frontend`, execute `npm run dev` e abra `http://localhost:5173`. Clique em **Explorar demonstração** para usar o layout sem configurar PostgreSQL. Servidor frontend deixado em execução nesta retomada.

### Verificação
- `npm run build`: aprovado, incluindo TypeScript. `npm test`: quatro testes de demonstração aprovados (Node 24 local; importação nativa de TypeScript).
- Navegador: 28 combinações de sete telas em 390/768/1024/1440 px, sem overflow horizontal ou erros JavaScript. Criação de espaço/projeto/tarefa, conclusão/exclusão, persistência após recarregar, busca vazia e controle de senha conferidos. Ajustada a largura mínima da navegação/grades no celular. Capturas reais com dados fictícios geradas fora do repositório.
- `dotnet test backend/TaskFlow.slnx --no-restore` continua falhando: suíte unitária referencia namespaces/fixtures inexistentes e possui colisão do tipo Task. Integração também não inicia porque falta o runtime Microsoft.AspNetCore.App 10.0 (há 11.0 instalado). Aviso NU1903 de Microsoft.OpenApi 2.0.0 permanece.

### Pendências da integração real
1. Alinhar autenticação do backend: MapIdentityApi emite tokens Identity, mas o mecanismo padrão configurado valida JWT. A demonstração local não comprova login/CRUD com o servidor real.
2. Revisar/aplicar migrations no PostgreSQL escolhido e validar autenticação e CRUD ponta a ponta; nenhuma conta real foi criada nem migration executada nesta retomada.
3. Corrigir a suíte backend, disponibilizar o runtime compatível e tratar o aviso de dependência após avaliação de compatibilidade.
4. Completar edição de campos/detalhes e permissões; a conclusão/reabertura de tarefas já está implementada.
5. Git: bin/obj já estavam versionados e alterados antes da retomada; Main está seis commits à frente e um atrás de origin/Main. Sem commit, push, merge ou descarte das alterações existentes nesta etapa. Não herdar autorizações de publicação do Saldoa.

## Registro anterior — backend e build (11/11/2026)
Fase concluída nesta sessão: **Backend CRUD completo + Frontend buildável**.

### Concluído
- **Domínio/Infraestrutura**
  - Entidades de domínio ajustadas para evitar acoplamento com `ApplicationUser` da camada de Infrastructure (`Workspace`, `WorkspaceMember`, `ProjectMember`, `Task`, `Comment`, `Activity`, `Notification`).
  - `AppDbContext` corrigido e configurado para `Workspaces`, `WorkspaceMembers`, `Projects`, `ProjectMembers`, `Tasks`, `Subtasks`, `Comments`, `Activities`, `Notifications` (chaves, relacionamentos, índices únicos, deletes).
  - Removidos placeholders `Class1.cs` (Domain/Application/Infrastructure).
- **Application**
  - DTOs: `WorkspaceDto`, `CreateWorkspaceDto`, `ProjectDto`, `CreateProjectDto`, `TaskDto`, `CreateTaskDto`.
  - Commands MediatR: Create/Update/Delete para Workspace, Project e Task.
  - Validadores FluentValidation para DTOs de criação.
- **API**
  - `Program.cs`: MediatR registrado (API + Application), endpoint `/api/auth/me` corrigido.
  - Handlers MediatR (API) para Workspace/Project/Task com regras básicas de acesso/membro/proprietário.
  - `WorkspacesController` refeito (GET all, GET by id, POST, PUT, DELETE) com DTOs.
  - `ProjectsController` criado (CRUD, filtro por `workspaceId`).
  - `TasksController` criado (CRUD, filtro por `projectId`).
- **Frontend (React/Vite/TS)**
  - Correções de build: aliases `@` e `src` (tsconfig/vite), `api.ts` tipado/compatível, `AppRoutes` com rotas de criação, Tailwind v4 (`@import "tailwindcss"` + `@tailwindcss/vite`), `vite.config` sem `__dirname`.
  - Páginas/componentes atualizados para consumir API real via React Query e remover dependências inexistentes (`redux`, store, imports inválidos): `Login`, `Register`, `Workspaces`, `Projects`, `Tasks`, `CreateWorkspace`, `CreateProject`, `CreateTask`, `Header`, `Sidebar`, `Layout`.
  - `Register.tsx` regravado em UTF-8 (sem BOM) para corrigir erro de parse no build.
- **Build/Validação**
  - `dotnet build backend/src/TaskFlow.API/TaskFlow.API.csproj`: **sucesso** (avisos de vulnerabilidade `Microsoft.OpenApi` 2.0.0).
  - `npm run build` (frontend): **sucesso** (`dist/` gerado).

### Pendências / Observações
- **Testes**: `dotnet test` da solution falha porque os testes unitários atuais (`AuthUnitTests`, `DefaultTestFixture`) referenciam comandos/fixtures (`RegisterCommand`, `LoginCommand`, `TaskFlow.Application.Authentication.*`, `AppDbContext` no UnitTests, etc.) que não existem na estrutura atual. É necessário reescrever a suíte de testes para refletir os commands/handlers/DTOs implementados.
- Banco/migrations: não executado nesta sessão; revisar migrations/`dotnet ef` conforme ambiente PostgreSQL.
- Build artifacts (`bin/`, `obj/`, `frontend/dist` se gerado) não devem ser commitados; revisar `.gitignore` conforme necessário.

### Próximos Passos Sugeridos
1. Reescrever testes unitários/integrados para CRUD (Workspace/Project/Task) e auth flow atual.
2. Ajustar resposta de login/registro do frontend para o formato real do Identity API (`accessToken`/`refreshToken`) e UX de erros.
3. Criar migrations EF Core e validar fluxo completo com PostgreSQL (docker-compose).
4. Adicionar tratamento global de exceções/ProblemDetails e validação FluentValidation no pipeline.
5. Evoluir UI (edição/exclusão, detalhes, proteção de rotas autenticadas, loading/erros melhores).
