import { t as translate, localizeError } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/services/api";
import { isDemo, type DemoMember } from "@/services/demo";
import { PageHeading, Feedback } from "@/components/ui/Shared";
import { IntegrationNotice } from "@/components/ui/IntegrationNotice";
import { useWorkData } from "@/features/work/useWorkData";
import { completed, searchText } from "@/features/work/workflow";
export function Teams() {
  useLanguage();
  const q = useWorkData();
  const demo = isDemo();
  const cache = useQueryClient();
  const members = useQuery({
    queryKey: ["demo-members"],
    enabled: demo,
    queryFn: async () => (await api.get<DemoMember[]>("/api/members")).data,
  });
  const [search, setSearch] = useState(""),
    [space, setSpace] = useState(""),
    [adding, setAdding] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("Colaborador"),
    [workspace, setWorkspace] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const items = members.data?.filter(
    (m) =>
      (!space || m.workspaceId === space) &&
      searchText(m.name + " " + m.email).includes(searchText(search)),
  );
  async function remove(member: DemoMember) {
    if (!confirm(translate("Remover ") + member.name + translate(" da equipe de demonstração?")))
      return;
    setBusy(true);
    setFailed(false);
    try {
      await api.delete("/api/members/" + member.id);
      await cache.invalidateQueries();
      setMessage("Participante removido da demonstração.");
    } catch (e) {
      setFailed(true);
      setMessage(handleApiError(e).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title={translate("Equipes")}
        description={translate("Pessoas, responsabilidades e contexto de trabalho.")}
        action={
          demo ? (
            <button
              className="button"
              aria-expanded={adding}
              aria-controls="member-form"
              onClick={() => setAdding(!adding)}
            >
              {translate("+ Adicionar participante")}{" "}
            </button>
          ) : undefined
        }
      />
      {!demo ? (
        <IntegrationNotice>
          {translate(
            "A API atual ainda não oferece gestão de membros. Essa integração precisa ser concluída para adicionar participantes e atribuir permissões reais. A demonstração permite avaliar o fluxo com dados locais.",
          )}{" "}
        </IntegrationNotice>
      ) : (
        <p className="page-note">
          {translate(
            "Equipe de demonstração. Alterações ficam neste navegador; nenhum convite por e-mail é enviado.",
          )}{" "}
        </p>
      )}
      {adding && (
        <form
          id="member-form"
          className="member-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setFailed(false);
            setMessage("");
            try {
              await api.post("/api/members", {
                name: name.trim(),
                email: email.trim(),
                role,
                workspaceId: workspace,
              });
              await cache.invalidateQueries();
              setName("");
              setEmail("");
              setAdding(false);
              setMessage("Participante adicionado à demonstração.");
            } catch (e) {
              setFailed(true);
              setMessage(handleApiError(e).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{translate("Novo participante")}</h2>
          <div className="form-field-grid">
            <label>
              {translate("Nome")}{" "}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </label>
            <label>
              {translate("E-mail")}{" "}
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {translate("Espaço")}{" "}
              <select required value={workspace} onChange={(e) => setWorkspace(e.target.value)}>
                <option value="">{translate("Selecione")}</option>
                {q.data?.spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {translate("Responsabilidade")}{" "}
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Colaborador">{translate("Colaborador")}</option>
                <option value="Responsável">{translate("Responsável")}</option>
                <option value="Observador">{translate("Observador")}</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={() => setAdding(false)}>
              {translate("Cancelar")}{" "}
            </button>
            <button className="button" disabled={busy}>
              {busy ? translate("Salvando…") : translate("Adicionar à equipe")}
            </button>
          </div>
        </form>
      )}
      {message && (
        <p className={failed ? "error" : "notice"} role={failed ? "alert" : "status"}>
          {failed ? localizeError(message) : translate(message)}
        </p>
      )}
      {demo && (
        <>
          <div className="toolbar">
            <label className="search">
              {translate("Buscar participante")}{" "}
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={translate("Nome ou e-mail…")}
              />
            </label>
            <label>
              {translate("Espaço")}{" "}
              <select value={space} onChange={(e) => setSpace(e.target.value)}>
                <option value="">{translate("Todos os espaços")}</option>
                {q.data?.spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Feedback
            loading={members.isLoading || q.isLoading}
            error={!!members.error || !!q.error}
            retry={() => {
              void members.refetch();
              void q.refetch();
            }}
          >
            {items?.length ? (
              <div className="member-list">
                {items.map((m) => (
                  <article className="member-row" key={m.id}>
                    <span className="member-avatar" aria-hidden="true">
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <h2>{m.name}</h2>
                      <p>{m.email}</p>
                      <small>
                        {q.data?.spaces.find((s) => s.id === m.workspaceId)?.name} ·{" "}
                        {q.data?.projects.filter((p) => p.workspaceId === m.workspaceId).length ||
                          0}{" "}
                        {translate("projetos do espaço")}{" "}
                      </small>
                    </div>
                    <span className="badge">{translate(m.role)}</span>
                    <span className="member-load">
                      {(() => {
                        const count =
                          q.data?.tasks.filter(
                            (t) => t.assignedToId === m.id && !completed(t.status),
                          ).length || 0;
                        return translate(
                          count === 1 ? "{count} tarefa aberta" : "{count} tarefas abertas",
                          { count },
                        );
                      })()}
                    </span>
                    <button
                      className="quiet delete"
                      disabled={busy}
                      onClick={() => void remove(m)}
                      aria-label={translate("Remover ") + m.name}
                    >
                      {translate("Remover")}{" "}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="feedback">
                <h2>{translate("Nenhum participante nesta seleção")}</h2>
                <p>{translate("Revise a busca ou adicione uma pessoa à demonstração.")}</p>
              </div>
            )}
          </Feedback>
        </>
      )}
    </>
  );
}
