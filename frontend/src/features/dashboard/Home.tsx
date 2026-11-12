import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Project, Task, Workspace } from "@/types";
import { PageHeading, Feedback, action, normalized, statusLabel } from "@/components/ui/Shared";
import { summarizeOverview, formatDeadline } from "./overview";
export function Home() {
  useLanguage();
  const [workspaceId, setWorkspaceId] = useState("");
  const query = useQuery({
    queryKey: ["overview"],
    retry: 1,
    queryFn: async () => {
      const [tasks, projects, spaces] = await Promise.all([
        api.get<Task[]>("/api/tasks"),
        api.get<Project[]>("/api/projects"),
        api.get<Workspace[]>("/api/workspaces"),
      ]);
      return { tasks: tasks.data, projects: projects.data, spaces: spaces.data };
    },
  });
  const summary = summarizeOverview(
    query.data?.projects || [],
    query.data?.tasks || [],
    workspaceId,
  );
  const selected = query.data?.spaces.find((s) => s.id === workspaceId);
  return (
    <>
      <PageHeading
        eyebrow={translate("PAINEL DE TRABALHO")}
        title={translate("Visão geral")}
        description={translate("Prioridades, progresso e prazos do seu trabalho.")}
        action={action("/tasks/create", translate("Nova tarefa"))}
      />
      <Feedback loading={query.isLoading} error={!!query.error} retry={query.refetch}>
        <div className="overview-scope">
          <label htmlFor="overview-workspace">
            {translate("Espaço de trabalho")}{" "}
            <select
              id="overview-workspace"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            >
              <option value="">{translate("Todos os espaços")}</option>
              {query.data?.spaces.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <span aria-live="polite">
            {selected?.name || translate("Visão consolidada")} · {summary.tasks.length}{" "}
            {summary.tasks.length === 1 ? translate("tarefa") : translate("tarefas")}
          </span>
        </div>
        <div className="metrics overview-metrics">
          {[
            [
              translate("Projetos ativos"),
              summary.activeProjects,
              translate("Frentes em andamento"),
            ],
            [
              translate("Total de tarefas"),
              summary.tasks.length,
              translate("Neste espaço de trabalho"),
            ],
            [translate("Em aberto"), summary.open, translate("Aguardando conclusão")],
            [translate("Concluídas"), summary.completed, translate("Entregas realizadas")],
          ].map(([label, value, note]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>
        <div className="overview-grid">
          <section className="panel" aria-labelledby="priorities-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{translate("FOCO AGORA")}</p>
                <h2 id="priorities-title">{translate("Próximos passos")}</h2>
              </div>
              <Link to="/tasks">{translate("Ver tarefas →")}</Link>
            </div>
            <p className="section-description">
              {translate("Prioridade mais alta primeiro; depois, prazo de entrega.")}{" "}
            </p>
            {summary.priorities.slice(0, 5).map((t) => (
              <Link to={"/tasks?projectId=" + t.projectId} className="task-line" key={t.id}>
                <span aria-hidden="true" className={"task-check " + normalized(t.status)} />
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {summary.projects.find((p) => p.id === t.projectId)?.name ||
                      translate("Projeto")}
                    {t.dueDate && Number.isFinite(Date.parse(t.dueDate))
                      ? " · " + formatDeadline(t.dueDate)
                      : ""}
                  </small>
                </div>
                <span className={"badge " + normalized(t.priority)}>{statusLabel(t.priority)}</span>
              </Link>
            ))}
            {!summary.priorities.length && (
              <div className="overview-empty">
                <h3>
                  {summary.tasks.length
                    ? translate("Tudo em dia neste espaço")
                    : translate("Seu próximo passo começa aqui")}
                </h3>
                <p>
                  {summary.tasks.length
                    ? translate("Todas as tarefas foram concluídas.")
                    : translate("Organize uma frente de trabalho e depois adicione suas tarefas.")}
                </p>
                <Link to={summary.projects.length ? "/tasks/create" : "/projects/create"}>
                  {summary.projects.length ? translate("Criar tarefa") : translate("Criar projeto")}{" "}
                  →
                </Link>
              </div>
            )}
          </section>
          <section className="project-overview" aria-labelledby="progress-title">
            <div className="section-heading">
              <h2 id="progress-title">{translate("Progresso dos projetos")}</h2>
              <Link to="/projects">{translate("Ver todos →")}</Link>
            </div>
            {summary.progress.slice(0, 4).map(({ project, total, completed, percent }, i) => (
              <Link
                className="project-row project-progress-row"
                to={"/tasks?projectId=" + project.id}
                key={project.id}
              >
                <span className="project-index">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.description || translate("Sem descrição adicionada.")}</p>
                  <div className="project-completion">
                    <span>
                      {total
                        ? completed + translate(" de ") + total + translate(" tarefas concluídas")
                        : translate("Nenhuma tarefa cadastrada")}
                    </span>
                    <strong>{total ? percent + "%" : "—"}</strong>
                  </div>
                  {total > 0 && (
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={translate("Conclusão de ") + project.name}
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: percent + "%" }} />
                    </div>
                  )}
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
            {!summary.progress.length && (
              <div className="overview-empty">
                <h3>{translate("Nenhum projeto neste espaço")}</h3>
                <p>{translate("Um projeto reúne as tarefas de uma mesma entrega.")}</p>
              </div>
            )}
            <Link className="text-action" to="/projects/create">
              {translate("+ Criar projeto")}{" "}
            </Link>
          </section>
        </div>
        <section className="deadline-section" aria-labelledby="deadline-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{translate("PLANEJAMENTO")}</p>
              <h2 id="deadline-title">{translate("Prazos a acompanhar")}</h2>
            </div>
            <span className="muted">{translate("Tarefas e projetos em aberto")}</span>
          </div>
          {summary.deadlines.length ? (
            <div className="deadline-list">
              {summary.deadlines.slice(0, 5).map((item) => (
                <Link
                  to={"/tasks?projectId=" + item.projectId}
                  className="deadline-row"
                  key={item.type + item.id}
                >
                  <time dateTime={item.date}>{formatDeadline(item.date)}</time>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.type === "task" ? translate("Tarefa") : translate("Projeto")} ·{" "}
                      {summary.projects.find((p) => p.id === item.projectId)?.name}
                    </small>
                  </div>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="deadline-empty">
              <strong>{translate("Nenhum prazo definido para os itens em aberto.")}</strong>
              <p>
                {translate(
                  "As datas de entrega disponíveis nos projetos e tarefas aparecem aqui, em ordem cronológica.",
                )}{" "}
              </p>
            </div>
          )}
        </section>
      </Feedback>
    </>
  );
}
