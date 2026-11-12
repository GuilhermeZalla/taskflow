import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import type { Project, Task, Workspace } from "@/types";
import { PageHeading, Feedback, action } from "@/components/ui/Shared";
import {
  selectProjects,
  projectStatus,
  projectStatusLabel,
  formatProjectDate,
} from "./project-list";
export function Projects() {
  useLanguage();
  const [params, setParams] = useSearchParams();
  const filters = {
    workspaceId: params.get("workspaceId") || "",
    search: params.get("search") || "",
    status: params.get("status") || "all",
    sort: params.get("sort") || "name",
  };
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || (key === "sort" && value === "name")) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, flushSync: true });
  };
  const query = useQuery({
    queryKey: ["projects-page"],
    retry: 1,
    queryFn: async () => {
      const [projects, tasks, spaces] = await Promise.all([
        api.get<Project[]>("/api/projects"),
        api.get<Task[]>("/api/tasks"),
        api.get<Workspace[]>("/api/workspaces"),
      ]);
      return { projects: projects.data, tasks: tasks.data, spaces: spaces.data };
    },
  });
  const { items, total } = selectProjects(
    query.data?.projects || [],
    query.data?.tasks || [],
    filters,
  );
  const hasFilters = !!filters.search || filters.status !== "all" || !!filters.workspaceId;
  return (
    <>
      <PageHeading
        eyebrow={translate("FRENTES DE TRABALHO")}
        title={translate("Projetos")}
        description={translate(
          "Objetivos claros, entregas acompanhadas e contexto para sua equipe.",
        )}
        action={action(
          "/projects/create" + (filters.workspaceId ? "?workspaceId=" + filters.workspaceId : ""),
          translate("Novo projeto"),
        )}
      />
      <div className="project-filters">
        <label className="project-search">
          {translate("Buscar projeto")}{" "}
          <input
            type="search"
            placeholder={translate("Nome ou descrição…")}
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </label>
        <label>
          {translate("Espaço de trabalho")}{" "}
          <select
            value={filters.workspaceId}
            onChange={(e) => update("workspaceId", e.target.value)}
          >
            <option value="">{translate("Todos os espaços")}</option>
            {query.data?.spaces.map((space) => (
              <option value={space.id} key={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {translate("Status")}{" "}
          <select value={filters.status} onChange={(e) => update("status", e.target.value)}>
            <option value="all">{translate("Todos os status")}</option>
            {["active", "planning", "review", "paused", "completed", "cancelled"].map((status) => (
              <option value={status} key={status}>
                {projectStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {translate("Ordenar por")}{" "}
          <select value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
            <option value="name">{translate("Nome do projeto")}</option>
            <option value="deadline">{translate("Prazo mais próximo")}</option>
            <option value="progress">{translate("Maior progresso")}</option>
          </select>
        </label>
      </div>
      <Feedback loading={query.isLoading} error={!!query.error} retry={query.refetch}>
        <div className="project-results">
          <span role="status">
            {items.length} {translate("de")} {total}{" "}
            {total === 1 ? translate("projeto") : translate("projetos")}
          </span>
          {hasFilters && (
            <button className="quiet" onClick={() => setParams({})}>
              {translate("Limpar filtros")}{" "}
            </button>
          )}
        </div>
        {items.length ? (
          <div className="projects-table-wrap">
            <table className="projects-table">
              <caption className="sr-only">
                {translate("Projetos com status, progresso e datas de entrega")}{" "}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{translate("Projeto")}</th>
                  <th scope="col">{translate("Status")}</th>
                  <th scope="col">{translate("Progresso")}</th>
                  <th scope="col">{translate("Prazo de entrega")}</th>
                  <th scope="col">
                    <span className="sr-only">{translate("Acessar projeto")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ project, total, completed, percent }) => (
                  <tr key={project.id}>
                    <td data-label="Projeto" className="project-name-cell">
                      <Link to={"/tasks?projectId=" + project.id}>{project.name}</Link>
                      <p>{project.description || translate("Sem descrição adicionada.")}</p>
                      <span className="project-context">
                        {query.data?.spaces.find((space) => space.id === project.workspaceId)
                          ?.name || translate("Espaço de trabalho")}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={"badge project-status-" + projectStatus(project.status)}>
                        {projectStatusLabel(project.status)}
                      </span>
                    </td>
                    <td data-label="Progresso">
                      <div className="project-table-progress">
                        <div>
                          <span>
                            {total
                              ? completed +
                                translate(" de ") +
                                total +
                                (total === 1 ? translate(" tarefa") : translate(" tarefas"))
                              : translate("Sem tarefas")}
                          </span>
                          <strong>{total ? percent + "%" : "—"}</strong>
                        </div>
                        {total > 0 && (
                          <div
                            className="progress-track"
                            role="progressbar"
                            aria-label={translate("Progresso de ") + project.name}
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <span style={{ width: percent + "%" }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Prazo de entrega">
                      <span className="project-due">{formatProjectDate(project.dueDate)}</span>
                      {project.startDate && (
                        <small>
                          {translate("Início:")} {formatProjectDate(project.startDate)}
                        </small>
                      )}
                    </td>
                    <td className="project-open-cell">
                      <Link
                        className="quiet"
                        aria-label={translate("Editar ") + project.name}
                        to={"/projects/" + project.id + "/edit"}
                      >
                        {translate("Editar")}{" "}
                      </Link>
                      <Link
                        aria-label={translate("Ver tarefas de ") + project.name}
                        to={"/tasks?projectId=" + project.id}
                      >
                        {translate("Ver tarefas")} <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="feedback project-empty">
            <h2>
              {hasFilters
                ? translate("Nenhum projeto corresponde aos filtros")
                : translate("Seu primeiro projeto começa aqui")}
            </h2>
            <p>
              {hasFilters
                ? translate("Tente outro nome, espaço ou status para encontrar o que procura.")
                : translate(
                    "Reúna as tarefas de uma entrega em um projeto e acompanhe seu progresso.",
                  )}
            </p>
            {hasFilters ? (
              <button className="button secondary" onClick={() => setParams({})}>
                {translate("Limpar filtros")}{" "}
              </button>
            ) : (
              action("/projects/create", translate("Criar primeiro projeto"))
            )}
          </div>
        )}
        <p className="project-footnote">
          {translate(
            "O progresso considera as tarefas concluídas. As datas aparecem quando estão definidas no projeto.",
          )}{" "}
        </p>
      </Feedback>
    </>
  );
}
