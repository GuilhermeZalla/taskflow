# TaskFlow

Aplicação web para gerenciamento colaborativo de projetos e tarefas, desenvolvida para portfólio. Reúne espaços de trabalho, prioridades, responsáveis, prazos e acompanhamento de entregas em uma interface disponível em português e inglês.

O frontend usa React e TypeScript; a API é desenvolvida em C# com ASP.NET Core, Entity Framework Core e MySQL. O projeto possui um modo de demonstração com dados fictícios no navegador e um fluxo separado de autenticação e persistência pela API. **Ainda não há aplicativo nativo nem publicação de produção documentada.**

![Tela de autenticação do TaskFlow](docs/screenshots/login-desktop.png)

## Demonstrações

GIFs montados com capturas reais de ações na interface, usando o modo **Explorar demonstração**. Os dados são fictícios e ficam no navegador utilizado na captura; essas mídias não demonstram integração com o MySQL, autenticação real ou envio de e-mails.

### Área de trabalho

Visão geral, projetos, tarefas em lista e quadro, calendário, equipes, relatórios e preferências.

![Navegação pelas páginas internas do TaskFlow](docs/demo/workspace-desktop.gif)

### Ciclo de uma tarefa

Preenchimento e criação de uma tarefa, mudança para **Em andamento**, conclusão e registro no histórico de atividade local.

![Criação, mudança de status, conclusão e histórico de uma tarefa na demonstração](docs/demo/tarefa-desktop.gif)

### Web no celular

Login, visão geral, projetos, tarefas e abertura do menu adaptado. Trata-se da interface web responsiva.

<img src="docs/demo/workspace-mobile.gif" alt="Navegação pela versão web do TaskFlow em tela de celular" width="300">

## Screenshots

Capturas em português feitas no modo de demonstração. Os PNGs mostram a página inteira, com altura variável. A navegação foi capturada em desktop e com viewport de celular de 390 × 844; a largura útil dos PNGs pode ser menor por causa da barra de rolagem. Datas e valores das mídias correspondem aos exemplos locais no momento da captura.

| Tela | Desktop | Celular |
| --- | --- | --- |
| Autenticação | [Ver captura](docs/screenshots/login-desktop.png) | [Ver captura](docs/screenshots/login-mobile.png) |
| Visão geral | [Ver captura](docs/screenshots/overview-desktop.png) | [Ver captura](docs/screenshots/overview-mobile.png) |
| Projetos | [Ver captura](docs/screenshots/projects-desktop.png) | [Ver captura](docs/screenshots/projects-mobile.png) |
| Tarefas em lista | [Ver captura](docs/screenshots/tasks-desktop.png) | [Ver captura](docs/screenshots/tasks-mobile.png) |
| Tarefas em quadro | [Ver captura](docs/screenshots/board-desktop.png) | — |
| Calendário | [Ver captura](docs/screenshots/calendar-desktop.png) | — |
| Equipes | [Ver captura](docs/screenshots/teams-desktop.png) | — |
| Atividade | [Ver captura](docs/screenshots/activity-desktop.png) | — |
| Relatórios | [Ver captura](docs/screenshots/reports-desktop.png) | — |
| Preferências | [Ver captura](docs/screenshots/settings-desktop.png) | — |

## Estrutura e stack

| Área | Tecnologias e responsabilidade |
| --- | --- |
| Backend | C#, ASP.NET Core 10, ASP.NET Core Identity, Entity Framework Core 10 e MySQL 8.0+ |
| Frontend | React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS 4, TanStack Query e Axios |
| Validação e casos de uso | FluentValidation, comandos e handlers com MediatR |
| Testes | xUnit e integração HTTP no backend; Node.js test runner no frontend |

- `backend/src/TaskFlow.Domain`: entidades do domínio.
- `backend/src/TaskFlow.Application`: comandos, DTOs e validação.
- `backend/src/TaskFlow.Infrastructure`: EF Core, Identity e migrations MySQL.
- `backend/src/TaskFlow.API`: endpoints e configuração da aplicação.
- `backend/tests`: testes unitários e de integração.
- `frontend`: interface React, rotas, componentes, traduções e adaptador de demonstração.
- `docs/screenshots` e `docs/demo`: capturas e GIFs apresentados neste README.
- [status.md](status.md): entregas, validações registradas e pendências para a versão 1.0.

## Executar localmente

Requisitos para o projeto completo: **.NET SDK 10 e runtime ASP.NET Core 10**, **Node.js 24** com npm e **MySQL 8.0+**. O Docker é opcional: o Compose fornecido usa MySQL 8.4. O comando de migrations também exige a ferramenta `dotnet-ef` da série 10; o projeto referencia EF Core 10.0.12.

Os exemplos abaixo partem da raiz do repositório e usam PowerShell. Preserve as configurações e o banco de uma instalação já existente.

### Conhecer a interface sem configurar o backend

```powershell
npm.cmd ci --prefix frontend
npm.cmd run dev --prefix frontend
```

Abra `http://localhost:5173` e clique em **Explorar demonstração**. Não é necessário criar conta. As alterações ficam no armazenamento local do navegador; a demonstração não é um fallback automático para falhas da API. Em **Preferências**, é possível reiniciar os exemplos mediante confirmação.

### Primeira instalação: banco de dados

Se usar o MySQL pelo Docker, copie o arquivo de exemplo somente quando ainda não houver `.env` na raiz:

```powershell
Copy-Item .env.example .env
```

Edite o novo arquivo e defina senhas próprias para `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`. O exemplo define `MYSQL_DATABASE=TaskFlowDb`, `MYSQL_USER=taskflow` e `MYSQL_PORT=3307`. Em seguida:

```powershell
docker compose up -d mysql
```

O volume `taskflow_mysql_data` mantém os dados entre reinícios. Se já houver uma instância MySQL instalada, use-a em vez de iniciar outro serviço na mesma porta: crie um banco vazio `TaskFlowDb` e um usuário `taskflow` com permissões limitadas a esse banco. Ajuste host, porta e credenciais de acordo com a sua instalação.

O `.env` é lido pelo Docker Compose. **O ASP.NET Core não carrega automaticamente esse arquivo**; configure a API pelo ambiente conforme o próximo passo. O perfil de desenvolvimento também possui configuração de conexão em `appsettings.Development.json`, que pode ser sobrescrita por `ConnectionStrings__DefaultConnection`.

### Configurar e iniciar a API

No terminal do backend, configure a conexão com a mesma senha de `MYSQL_PASSWORD` definida para o usuário `taskflow`. Os valores abaixo são um modelo; não publique credenciais reais.

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=127.0.0.1;Port=3307;Database=TaskFlowDb;User ID=taskflow;Password=SUA_SENHA_MYSQL;'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Cors__AllowedOrigins__0 = 'http://localhost:5173'
$env:Cors__AllowedOrigins__1 = 'http://127.0.0.1:5173'

dotnet restore backend/TaskFlow.slnx
dotnet ef database update --project backend/src/TaskFlow.Infrastructure --startup-project backend/src/TaskFlow.API
dotnet run --no-launch-profile --project backend/src/TaskFlow.API --urls http://127.0.0.1:5080
```

Para instalar o CLI do EF Core, caso ele ainda não esteja disponível:

```powershell
dotnet tool install --global dotnet-ef --version 10.0.12
```

Mantenha esse terminal aberto. `GET http://127.0.0.1:5080/api/health` verifica a aplicação; `/api/health/db` verifica a conexão MySQL. Em `Development`, a especificação OpenAPI fica em `/openapi/v1.json`. As chaves de Data Protection podem ser persistidas com `DataProtection__KeyPath`; o perfil local já configura `.keys`.

O comando acima usa a porta 5080 explicitamente para corresponder ao endereço padrão do cliente HTTP do frontend. O perfil HTTP original em `launchSettings.json` usa 5171: se optar por ele, configure o frontend para o mesmo endereço.

### Iniciar o frontend com a API

Em outro terminal, na raiz:

```powershell
npm.cmd ci --prefix frontend
npm.cmd run dev --prefix frontend
```

Abra `http://localhost:5173`, crie uma conta e entre com ela. Para mudar a URL da API, crie ou ajuste `frontend/.env` com `VITE_API_URL=http://127.0.0.1:5080` e reinicie o Vite. O cliente usa esse endereço como padrão quando a variável não está definida; o `.env.example` do frontend contém outro endereço de exemplo, que precisa ser ajustado se for copiado.

As chamadas do frontend vão diretamente à API, portanto a origem do Vite precisa estar autorizada no CORS. Para encerrar cada servidor, pressione `Ctrl+C` no respectivo terminal. O .NET SDK 11 sozinho não substitui a instalação do runtime ASP.NET Core 10 exigido pelo projeto.

## Autenticação e interface

A API usa ASP.NET Core Identity. A tela de cadastro envia nome, e-mail e senha para `POST /api/auth/register`; o login usa `POST /login`. O frontend armazena o `accessToken` retornado no navegador e o envia como `Authorization: Bearer`. A saída remove o token local; as permissões de acesso aos recursos são verificadas no backend.

O formulário oferece mostrar/ocultar senha, validações e feedback de envio. O cadastro exige senha de pelo menos oito caracteres, com maiúsculas, minúsculas e números. As páginas internas usam uma navegação compartilhada, estados de carregamento, erro e vazio e uma identidade baseada em verde-floresta e tons de papel.

## Funcionalidades

- **Visão geral:** tarefas em aberto e concluídas, projetos ativos, prazos vencidos, prioridades e progresso calculado.
- **Espaços e projetos:** criação e edição, busca e filtros, status, datas e progresso das tarefas relacionadas.
- **Tarefas:** lista e quadro, filtros por projeto/status/prioridade, ordenação, edição, conclusão/reabertura e exclusão confirmada.
- **Planejamento:** calendário de prazos, etiquetas, dependências com validação de ciclos e pré-requisitos e modelos de projeto com cópia de tarefas.
- **Colaboração:** gestão de participantes cadastrados, atribuições, comentários, menções e histórico de atividade.
- **Acompanhamento:** notificações internas, lembretes no app e relatórios com filtros e exportação CSV.
- **Preferências:** português/inglês, densidade das listas e informações da sessão.

## API

Os recursos do produto usam o prefixo `/api`; o login do Identity fica na raiz. Os endpoints de recursos exigem autenticação e aplicam regras de acesso por usuário e contexto do espaço.

| Grupo | Endpoints principais |
| --- | --- |
| Saúde | `GET /api/health`, `GET /api/health/db` |
| Conta | `POST /api/auth/register`, `POST /login`, `GET /api/auth/me` |
| Espaços | `GET/POST /api/workspaces`, `GET/PUT/DELETE /api/workspaces/{id}` |
| Projetos | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}` |
| Tarefas | `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/{id}` |
| Participantes | `GET /api/members`, gerenciamento em `/api/workspaces/{workspaceId}/members` |
| Comentários | `GET/POST /api/tasks/{taskId}/comments`, edição e exclusão por comentário |
| Atividade | `GET /api/activities` |
| Notificações | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all` |
| Etiquetas | `/api/workspaces/{workspaceId}/labels` e `/api/tasks/{taskId}/labels` |
| Dependências | `/api/tasks/{taskId}/dependencies` |
| Modelos | `/api/workspaces/{workspaceId}/templates` e `POST /api/templates/{templateId}/apply` |

O OpenAPI e os controllers são a referência para métodos, filtros, campos e respostas detalhadas. Os relatórios atuais são compostos no frontend a partir dos registros retornados pela API; a exportação CSV é gerada no cliente.

## Idiomas e demonstração

A interface oferece português e inglês por catálogo de traduções. A escolha fica salva no navegador, sincroniza entre abas e é enviada no cabeçalho `Accept-Language`. Datas são formatadas conforme o idioma; os valores internos usados pela API permanecem estáveis. Conteúdo cadastrado pelo usuário não é traduzido automaticamente.

Os exemplos da demonstração têm apresentação nos dois idiomas. Seu adaptador local usa `localStorage` para dados e `sessionStorage` para ativar a sessão de demonstração. O idioma das respostas próprias da API ainda precisa de validação, conforme registrado em [status.md](status.md).

## Verificação

Na raiz do projeto:

```powershell
dotnet test backend/TaskFlow.slnx
npm.cmd test --prefix frontend
npm.cmd run build --prefix frontend
```

Os testes do frontend cobrem regras da demonstração, visão geral, filtros de projetos, organização do trabalho e traduções. Os testes de integração .NET usam `WebApplicationFactory` e substituem o banco pelo provedor EF InMemory; cobrem autenticação, permissões, membros, comentários, notificações e planejamento, mas não comprovam o comportamento transacional ou de concorrência do MySQL. Validar os fluxos completos no banco real continua sendo uma etapa separada.

As capturas e os GIFs deste README verificam a apresentação e os fluxos mostrados na demonstração. Eles não substituem testes de autorização ou integração da API. Na revisão da versão 1.0, passaram 26 testes do frontend, 5 testes unitários e 4 testes HTTP da API; o build do frontend também passou. O check do MySQL local respondeu `Healthy`. Os testes da API nesta máquina precisaram de `DOTNET_ROLL_FORWARD=Major`, pois o runtime ASP.NET Core 10 não está instalado.

## Decisões técnicas

- **Frontend e API separados:** React Router organiza a navegação; a API mantém persistência e regras de acesso.
- **C# em camadas:** Domain, Application, Infrastructure e API separam entidades, casos de uso, infraestrutura e transporte HTTP.
- **EF Core e MySQL:** migrations versionam o esquema e o Identity utiliza a persistência da aplicação.
- **Consultas centralizadas:** TanStack Query gerencia cache e invalidação; Axios concentra URL, cabeçalhos e erros HTTP.
- **Demonstração explícita:** um adaptador local permite explorar o produto sem conta ou backend, com indicação dos dados fictícios.
- **Indicadores derivados dos registros:** progresso, contagens e prazos usam os dados disponíveis, sem inventar horas ou produtividade.
- **Design consistente:** tokens, componentes compartilhados, navegação responsiva e foco visível sustentam as páginas.

## Estado atual e próximos passos

O escopo da versão 1.0 é a aplicação web para execução local e distribuição do código pelo GitHub. A demonstração e os fluxos principais estão disponíveis; a API local respondeu aos health checks com MySQL. A regressão completa dos fluxos com dados reais no MySQL ainda não foi executada. Confirmação e recuperação por e-mail, convites por e-mail e notificações externas foram adiados para avaliação na 1.1. A gestão atual de participantes cadastrados não envia convites por e-mail.

Consulte [status.md](status.md) para a lista de validações e limitações. Hospedagem pública, HTTPS, backups de produção e licença de produção do MediatR ainda precisam de uma etapa própria antes de disponibilizar o serviço online. O projeto permanece uma aplicação web responsiva, sem aplicativo nativo.

## Uso de Inteligência Artificial

Ferramentas de IA foram utilizadas como apoio de produtividade na elaboração, organização e revisão da **documentação**, na criação de **mockups e referências visuais**, em sugestões e auxílio à implementação de **layout, estilos e responsividade** e na elaboração e revisão de **cenários e testes automatizados**.

A ideia do produto e as regras de negócio são de autoria do desenvolvedor. As decisões técnicas, a arquitetura, a revisão das implementações e a responsabilidade pelo código e pelo resultado final permanecem com ele.
