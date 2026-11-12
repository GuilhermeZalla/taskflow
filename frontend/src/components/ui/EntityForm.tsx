import { t as translate, localizeError } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/services/api";
import { PageHeading, Feedback } from "./Shared";
import { isDemo, type DemoMember } from "@/services/demo";
import { dateInput } from "@/features/work/workflow";
type RecordData = {
  name?: string;
  title?: string;
  description?: string;
  workspaceId?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  startDate?: string | null;
  dueDate?: string | null;
  assignedToId?: string | null;
};
export function EntityForm({ kind }: { kind: "workspaces" | "projects" | "tasks" }) {
  useLanguage();
  const { id } = useParams();
  const task = kind === "tasks",
    space = kind === "workspaces";
  const [params] = useSearchParams();
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [parent, setParent] = useState(params.get(task ? "projectId" : "workspaceId") || ""),
    [priority, setPriority] = useState("Medium"),
    [status, setStatus] = useState(params.get("status") || (task ? "ToDo" : "Active")),
    [start, setStart] = useState(""),
    [due, setDue] = useState(""),
    [assigned, setAssigned] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    cache = useQueryClient();
  const record = useQuery({
    queryKey: ["entity", kind, id],
    enabled: !!id,
    retry: 1,
    queryFn: async () => (await api.get<RecordData>("/api/" + kind + "/" + id)).data,
  });
  useEffect(() => {
    if (record.data) {
      const r = record.data;
      setName(r.title || r.name || "");
      setDescription(r.description || "");
      setParent(r.projectId || r.workspaceId || "");
      setPriority(r.priority || "Medium");
      setStatus(r.status || (task ? "ToDo" : "Active"));
      setStart(dateInput(r.startDate));
      setDue(dateInput(r.dueDate));
      setAssigned(r.assignedToId || "");
    }
  }, [record.data, task]);
  const parentKind = task ? "projects" : "workspaces";
  const parents = useQuery({
    queryKey: ["/api/" + parentKind],
    enabled: !space,
    retry: 1,
    queryFn: async () =>
      (await api.get<Array<{ id: string; name: string }>>("/api/" + parentKind)).data,
  });
  const members = useQuery({
    queryKey: ["demo-members"],
    enabled: task && isDemo(),
    queryFn: async () => (await api.get<DemoMember[]>("/api/members")).data,
  });
  const label = task
    ? translate("tarefa")
    : space
      ? translate("espaço de trabalho")
      : translate("projeto");
  async function remove() {
    if (
      !confirm(
        translate("Excluir este ") +
          label +
          "? " +
          (space
            ? translate("Projetos e tarefas associados também serão removidos.")
            : task
              ? translate("Esta ação não pode ser desfeita.")
              : translate("As tarefas associadas também serão removidas.")),
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api.delete("/api/" + kind + "/" + id);
      await cache.invalidateQueries();
      navigate("/" + kind);
    } catch (e) {
      setError(handleApiError(e).message);
    } finally {
      setBusy(false);
    }
  }
  const iso = (value: string) => (value ? value + "T12:00:00Z" : null);
  return (
    <>
      <Link className="back-link" to={"/" + kind}>
        {translate("← Voltar")}{" "}
      </Link>
      <PageHeading
        title={(id ? translate("Editar ") : translate("Criar ")) + label}
        description={
          id
            ? translate("Atualize o contexto e mantenha o trabalho em ordem.")
            : translate("Defina o resultado esperado e os próximos passos.")
        }
      />
      <Feedback loading={!!id && record.isLoading} error={!!record.error} retry={record.refetch}>
        <div className="form-layout">
          <form
            className="editor-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (!space && !task && start && due && due < start) {
                setError("O prazo deve ser igual ou posterior ao início do projeto.");
                return;
              }
              setBusy(true);
              try {
                const body = task
                  ? {
                      title: name.trim(),
                      description,
                      projectId: parent,
                      priority,
                      status,
                      dueDate: iso(due),
                      assignedToId: assigned || null,
                    }
                  : space
                    ? { name: name.trim(), description }
                    : {
                        name: name.trim(),
                        description,
                        workspaceId: parent,
                        status,
                        startDate: iso(start),
                        dueDate: iso(due),
                      };
                if (id) await api.put("/api/" + kind + "/" + id, body);
                else await api.post("/api/" + kind, body);
                await cache.invalidateQueries();
                navigate("/" + kind);
              } catch (e) {
                setError(handleApiError(e).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy}>
              <label>
                {task
                  ? translate("Título da tarefa")
                  : space
                    ? translate("Nome do espaço")
                    : translate("Nome do projeto")}
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={150}
                  placeholder={
                    task
                      ? translate("Ex.: Revisar o fluxo de cadastro")
                      : translate("Como vamos chamar este trabalho?")
                  }
                />
              </label>
              <label>
                {translate("Descrição")} <small>{translate("opcional")}</small>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={translate("Contexto e resultado esperado.")}
                />
              </label>
              {!space && (
                <label>
                  {task ? translate("Projeto") : translate("Espaço de trabalho")}
                  <select
                    required
                    disabled={!!id || parents.isLoading || !!parents.error}
                    value={parent}
                    onChange={(e) => setParent(e.target.value)}
                  >
                    <option value="">{translate("Selecione uma opção")}</option>
                    {parents.data?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {parents.error ? (
                    <span className="error">
                      {translate("Não foi possível carregar as opções.")}{" "}
                      <button
                        type="button"
                        className="quiet"
                        onClick={() => void parents.refetch()}
                      >
                        {translate("Tentar novamente")}{" "}
                      </button>
                    </span>
                  ) : !parents.isLoading && !parents.data?.length ? (
                    <Link to={"/" + parentKind + "/create"}>
                      {translate("Criar")}{" "}
                      {task ? translate("projeto") : translate("espaço de trabalho")}{" "}
                      {translate("primeiro →")}{" "}
                    </Link>
                  ) : null}
                </label>
              )}
              {!space && (
                <div className="form-field-grid">
                  <label>
                    {translate("Status")}{" "}
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      {(task
                        ? [
                            ["ToDo", translate("A fazer")],
                            ["InProgress", translate("Em andamento")],
                            ["Review", translate("Em revisão")],
                            ["Done", translate("Concluída")],
                          ]
                        : [
                            ["Active", translate("Em andamento")],
                            ["Planning", translate("Planejamento")],
                            ["Review", translate("Em revisão")],
                            ["OnHold", translate("Pausado")],
                            ["Completed", translate("Concluído")],
                            ["Cancelled", translate("Cancelado")],
                          ]
                      ).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {task ? (
                    <label>
                      {translate("Prioridade")}{" "}
                      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                        {[
                          ["Low", translate("Baixa")],
                          ["Medium", translate("Média")],
                          ["High", translate("Alta")],
                          ["Urgent", translate("Urgente")],
                        ].map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      {translate("Data de início")}{" "}
                      <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                    </label>
                  )}
                  <label>
                    {translate("Prazo de entrega")} <small>{translate("opcional")}</small>
                    <input
                      type="date"
                      min={!task ? start : undefined}
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                  {task && isDemo() && (
                    <label>
                      {translate("Responsável")} <small>{translate("demonstração local")}</small>
                      <select value={assigned} onChange={(e) => setAssigned(e.target.value)}>
                        <option value="">{translate("Sem responsável")}</option>
                        {members.data?.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="error">
                {localizeError(error)}
              </p>
            )}
            <div className="form-actions">
              {id && (
                <button
                  type="button"
                  className="quiet delete"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  {translate("Excluir")}{" "}
                </button>
              )}
              <Link className="button secondary" to={"/" + kind}>
                {translate("Cancelar")}{" "}
              </Link>
              <button
                className="button"
                disabled={
                  busy ||
                  !name.trim() ||
                  (!space && (!parent || !!parents.error || parents.isLoading))
                }
              >
                {busy
                  ? translate("Salvando…")
                  : id
                    ? translate("Salvar alterações")
                    : translate("Criar ") + label}
              </button>
            </div>
          </form>
          <aside className="form-note">
            <p className="eyebrow">{translate("CONTEXTO QUE AJUDA")}</p>
            <h2>{translate("Um objetivo claro orienta a entrega.")}</h2>
            <p>
              {translate(
                "Descreva o resultado esperado. Datas e status atualizados alimentam a visão geral, o calendário e os relatórios.",
              )}{" "}
            </p>
            {task && !isDemo() && (
              <p>
                {translate(
                  "A atribuição de responsáveis será disponibilizada com a integração de membros. A atribuição existente é preservada ao editar.",
                )}{" "}
              </p>
            )}
          </aside>
        </div>
      </Feedback>
    </>
  );
}
