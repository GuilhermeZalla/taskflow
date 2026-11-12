# TaskFlow 1.0.0

Primeira versão da aplicação web para execução local e apresentação pelo GitHub. Não inclui aplicativo nativo nem hospedagem pública.

## Incluído

- Interface responsiva em português e inglês, com demonstração de dados fictícios no navegador.
- Autenticação, espaços de trabalho, projetos e tarefas com API C# e MySQL.
- Equipes, comentários com menções, notificações internas, etiquetas, dependências e modelos de projeto.
- Calendário, histórico de atividade, relatórios e exportação CSV.
- README com instruções de execução, capturas e demonstrações; PDF independente de apresentação do projeto.

## Verificação

- 26 testes do frontend e build de produção aprovados.
- 5 testes unitários e 4 testes HTTP da API aprovados; os testes HTTP usam EF Core InMemory.
- Health checks da API local responderam HTTP 200, incluindo conexão MySQL `Healthy`.
- Oito rotas internas conferidas em larguras de 390, 768 e 1440 px, sem rolagem horizontal.

## Limitações conhecidas

- A rodada de testes HTTP não substitui uma regressão completa dos fluxos de escrita e leitura no MySQL real. O usuário deve testar com dados descartáveis antes de confiar dados próprios à aplicação.
- Nesta máquina, os testes da API usaram `DOTNET_ROLL_FORWARD=Major` porque falta o runtime ASP.NET Core 10; para execução padrão, instale o runtime ASP.NET Core 10.
- Confirmação e recuperação de conta por e-mail, convites por e-mail e notificações externas foram adiados para a 1.1.
- Uma futura publicação online precisa de HTTPS, segredos seguros, logs, backup/restauração e conferência da licença de produção do MediatR 14.3.0.

As instruções de instalação e execução estão no [README](../README.md). O acompanhamento técnico está em [status.md](../status.md).
