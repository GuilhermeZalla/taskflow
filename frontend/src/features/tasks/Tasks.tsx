import { t as translate, localizeError } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/services/api";
import type { Task } from "@/types";
import { PageHeading, Feedback, action, statusLabel } from "@/components/ui/Shared";
import { useWorkData } from "@/features/work/useWorkData";
import { filterTasks, taskStatus, completed, isOverdue } from "@/features/work/workflow";
import { formatProjectDate } from "@/features/projects/project-list";
export function Tasks() {
  useLanguage();
  const [params, setParams] = useSearchParams();
  const query = useWorkData();
  const cache = useQueryClient();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const filters = {
    search: params.get("search") || "",
    status: params.get("status") || "all",
    priority: params.get("priority") || "all",
    projectId: params.get("projectId") || "",
    sort: params.get("sort") || "priority",
  };
  const view = params.get("view") === "board" ? "board" : "list";
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, flushSync: true });
  };
  const items = filterTasks(query.data?.tasks || [], filters);
  async function change(t: Task, status: string, remove = false) {
    if (
      remove &&
      !confirm(
        translate("Excluir a tarefa “") +
          t.title +
          translate("”? Esta ação não pode ser desfeita."),
      )
    )
      return;
    setBusy(t.id);
    setMessage("");
    setFailed(false);
    try {
      if (remove) await api.delete("/api/tasks/" + t.id);
      else await api.put("/api/tasks/" + t.id, { ...t, status });
      await cache.invalidateQueries();
      setMessage(remove ? "Tarefa excluída." : "Tarefa atualizada.");
    } catch (e) {
      setFailed(true);
      setMessage(handleApiError(e).message);
    } finally {
      setBusy("");
    }
  }
  function row(t: Task, asBoardCard = false) {
    return (
      <article className={"task-line task-record" + (asBoardCard ? " task-board-card" : "")} key={t.id}>
        <button
          className={"task-check " + (completed(t.status) ? "done" : taskStatus(t.status))}
          disabled={!!busy}
          aria-label={
            (completed(t.status) ? translate("Reabrir ") : translate("Concluir ")) + t.title
          }
          onClick={() => void change(t, completed(t.status) ? "ToDo" : "Done")}
        >
          {completed(t.status) ? "✓" : ""}
        </button>
        <div className="task-copy">
          {asBoardCard && (
            <small className="task-board-project">
              {query.data?.projects.find((p) => p.id === t.projectId)?.name || translate("Projeto")}
            </small>
          )}
          <Link className="task-title" to={"/tasks/" + t.id + "/edit"}>
            {t.title}
          </Link>
          {!asBoardCard && (
            <small>
              {query.data?.projects.find((p) => p.id === t.projectId)?.name || translate("Projeto")}
            </small>
          )}
          {t.description && <p className="task-description">{t.description}</p>}
          <div className="task-details">
            <span className={isOverdue(t.dueDate, t.status) ? "due-late" : ""}>
              {t.dueDate
                ? translate("Prazo: ") + formatProjectDate(t.dueDate)
                : translate("Sem prazo definido")}
            </span>
            {t.assignedToName && <span>{t.assignedToName}</span>}
          </div>
        </div>
        <span className={"badge " + t.priority.toLowerCase()}>{statusLabel(t.priority)}</span>
        <label className={"task-status-control" + (asBoardCard ? " board-card-hidden-control" : "")}>
          <span className="sr-only">
            {translate("Status de")} {t.title}
          </span>
          <select
            disabled={!!busy}
            value={taskStatus(t.status)}
            onChange={(e) => void change(t, canonicalStatus(e.target.value))}
          >
            {[
              ["todo", translate("A fazer")],
              ["inprogress", translate("Em andamento")],
              ["review", translate("Em revisão")],
              ["done", translate("Concluída")],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <Link
          className={"quiet" + (asBoardCard ? " board-card-open" : "")}
          to={"/tasks/" + t.id + "/edit"}
          aria-label={translate("Editar ") + t.title}
        >
          {translate("Editar")}{" "}
        </Link>
        <button
          className={"quiet delete" + (asBoardCard ? " board-card-hidden-control" : "")}
          disabled={!!busy}
          onClick={() => void change(t, t.status, true)}
          aria-label={translate("Excluir ") + t.title}
        >
          {translate("Excluir")}{" "}
        </button>
      </article>
    );
  }
  const canonicalStatus = (key: string) =>
    (
      { todo: "ToDo", inprogress: "InProgress", review: "Review", done: "Done" } as Record<
        string,
        string
      >
    )[key] || key;
  return (
    <>
      <PageHeading
        title={translate("Tarefas")}
        description={translate("Prioridades, responsáveis e entregas em um só lugar.")}
        action={action(
          "/tasks/create" + (filters.projectId ? "?projectId=" + filters.projectId : ""),
          translate("Nova tarefa"),
        )}
      />
      <div className="task-filters">
        <label>
          {translate("Buscar tarefas")}{" "}
          <input
            type="search"
            placeholder={translate("Título ou descrição…")}
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </label>
        <label>
          {translate("Projeto")}{" "}
          <select value={filters.projectId} onChange={(e) => update("projectId", e.target.value)}>
            <option value="">{translate("Todos os projetos")}</option>
            {query.data?.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {translate("Status")}{" "}
          <select value={filters.status} onChange={(e) => update("status", e.target.value)}>
            <option value="all">{translate("Todos os status")}</option>
            {["todo", "inprogress", "review", "done"].map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {translate("Prioridade")}{" "}
          <select value={filters.priority} onChange={(e) => update("priority", e.target.value)}>
            <option value="all">{translate("Todas")}</option>
            {["urgent", "high", "medium", "low"].map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {translate("Ordenar")}{" "}
          <select value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
            <option value="priority">{translate("Prioridade")}</option>
            <option value="deadline">{translate("Prazo")}</option>
            <option value="name">{translate("Nome")}</option>
          </select>
        </label>
      </div>
      <div className="project-results">
        <span role="status">
          {items.length} {items.length === 1 ? translate("tarefa") : translate("tarefas")}
        </span>
        <div className="view-toggle">
          {[
            ["list", translate("Lista")],
            ["board", translate("Quadro")],
          ].map(([v, l]) => (
            <button key={v} aria-pressed={view === v} onClick={() => update("view", v!)}>
              {l}
            </button>
          ))}
        </div>
        <button className="quiet" onClick={() => setParams({})}>
          {translate("Limpar filtros")}{" "}
        </button>
      </div>
      {message && (
        <p className={failed ? "error" : "notice"} role={failed ? "alert" : "status"}>
          {failed ? localizeError(message) : translate(message)}
        </p>
      )}
      <Feedback loading={query.isLoading} error={!!query.error} retry={query.refetch}>
        {!items.length ? (
          <div className="feedback">
            <h2>{translate("Nenhuma tarefa nesta seleção")}</h2>
            <p>{translate("Ajuste os filtros ou registre o próximo passo do projeto.")}</p>
            {action("/tasks/create", translate("Criar tarefa"))}
          </div>
        ) : view === "list" ? (
          <section className="panel task-list">{items.map((task) => row(task))}</section>
        ) : (
          <div className="board">
            {[
              "todo",
              "inprogress",
              "review",
              "done",
              ...new Set(
                items
                  .map((t) => taskStatus(t.status))
                  .filter((s) => !["todo", "inprogress", "review", "done"].includes(s)),
              ),
            ].map((key) => (
              <section className="board-column" key={key}>
                <h2>
                  {statusLabel(key)}
                  <span>{items.filter((t) => taskStatus(t.status) === key).length}</span>
                </h2>
                {items.filter((t) => taskStatus(t.status) === key).map((task) => row(task, true))}
                {!items.some((t) => taskStatus(t.status) === key) && (
                  <p className="board-empty">{translate("Sem tarefas nesta etapa.")}</p>
                )}
                <Link
                  className="text-action"
                  to={
                    "/tasks/create?status=" +
                    canonicalStatus(key) +
                    (filters.projectId ? "&projectId=" + filters.projectId : "")
                  }
                >
                  {translate("+ Adicionar tarefa")}{" "}
                </Link>
              </section>
            ))}
          </div>
        )}
      </Feedback>
    </>
  );
}
