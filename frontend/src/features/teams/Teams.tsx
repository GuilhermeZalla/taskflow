import { t as translate, localizeError, getLocale } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/services/api";
import { isDemo, type DemoMember } from "@/services/demo";
import { PageHeading, Feedback } from "@/components/ui/Shared";
import { useWorkData } from "@/features/work/useWorkData";
import { completed, searchText } from "@/features/work/workflow";
export function Teams() {
  useLanguage();
  const q = useWorkData();
  const demo = isDemo();
  const cache = useQueryClient();
  const members = useQuery({
    queryKey: ["workspace-members"],
    enabled: true,
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
  const invitations = useQuery({
    queryKey: ["workspace-invitations", workspace],
    enabled: !demo && Boolean(workspace),
    queryFn: async () =>
      (await api.get<Invitation[]>(`/api/workspaces/${workspace}/invitations`)).data,
  });
  const [failed, setFailed] = useState(false);
  const items = members.data?.filter(
    (m) =>
      (!space || m.workspaceId === space) &&
      searchText(m.name + " " + m.email).includes(searchText(search)),
  );
  async function remove(member: DemoMember) {
    if (
      !confirm(
        translate("Remover ") + member.name + translate(demo ? " da equipe de demonstração?" : " da equipe?"),
      )
    )
      return;
    setBusy(true);
    setFailed(false);
    try {
      await api.delete(
        demo
          ? "/api/members/" + member.id
          : "/api/workspaces/" + member.workspaceId + "/members/" + member.id,
      );
      await cache.invalidateQueries();
      setMessage(demo ? "Participante removido da demonstração." : "Participante removido.");
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
            <button
              className="button"
              aria-expanded={adding}
              aria-controls="member-form"
              onClick={() => setAdding(!adding)}
            >
              {translate("+ Adicionar participante")}{" "}
            </button>
        }
      />
      {demo ? (
        <p className="page-note">
          {translate(
            "Equipe de demonstração. Alterações ficam neste navegador; nenhum convite por e-mail é enviado.",
          )}{" "}
        </p>
      ) : (
        <p className="page-note">
          {translate("Convide pessoas para este espaço por e-mail.")}
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
              if (demo) {
                await api.post("/api/members", {
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  workspaceId: workspace,
                });
              } else {
                const apiRole =
                  role === "Responsável" ? "Manager" : role === "Observador" ? "Observer" : "Member";
                await api.post("/api/workspaces/" + workspace + "/invitations", {
                  email: email.trim(),
                  role: apiRole,
                });
              }
              await cache.invalidateQueries();
              await invitations.refetch();
              setName("");
              setEmail("");
              setAdding(false);
              setMessage(demo ? "Participante adicionado à demonstração." : "Convite registrado e aguardando envio.");
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
            {demo && <label>
              {translate("Nome")}{" "}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </label>}
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
      {!demo && workspace && (
        <section className="settings-section" aria-labelledby="pending-invitations-heading">
          <div>
            <p className="eyebrow">{translate("CONVITES")}</p>
            <h2 id="pending-invitations-heading">{translate("Convites pendentes")}</h2>
            <p>{translate("Os convites expiram em sete dias. Enviar novamente renova o link.")}</p>
          </div>
          <Feedback loading={invitations.isLoading} error={!!invitations.error} retry={invitations.refetch}>
            {invitations.data?.length ? (
              <div className="member-list">
                {invitations.data.map((invitation) => (
                  <article className="member-row" key={invitation.id}>
                    <div>
                      <h3>{invitation.email}</h3>
                      <small>{translate("Expira em")} {new Date(invitation.expiresAt).toLocaleDateString(getLocale())}</small>
                    </div>
                    <span className="badge">
                      {translate(({ Manager: "Responsável", Member: "Colaborador", Observer: "Observador" } as Record<string, string>)[invitation.role] || invitation.role)}
                    </span>
                    <button
                      className="quiet"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setFailed(false);
                        try {
                          await api.post(`/api/workspaces/${workspace}/invitations`, {
                            email: invitation.email,
                            role: invitation.role,
                          });
                          await invitations.refetch();
                          setMessage("Convite registrado e aguardando envio.");
                        } catch (error) {
                          setFailed(true);
                          setMessage(handleApiError(error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {translate("Enviar novamente")}
                    </button>
                    <button
                      className="quiet delete"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setFailed(false);
                        try {
                          await api.delete(`/api/workspaces/${workspace}/invitations/${invitation.id}`);
                          await invitations.refetch();
                          setMessage("Convite cancelado.");
                        } catch (error) {
                          setFailed(true);
                          setMessage(handleApiError(error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {translate("Cancelar convite")}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">{translate("Nenhum convite pendente neste espaço.")}</p>
            )}
          </Feedback>
        </section>
      )}
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
                        {m.workspaceName || q.data?.spaces.find((s) => s.id === m.workspaceId)?.name} ·{" "}
                        {q.data?.projects.filter((p) => p.workspaceId === m.workspaceId).length ||
                          0}{" "}
                        {translate("projetos do espaço")}{" "}
                      </small>
                    </div>
                    <span className="badge">
                      {translate(
                        ({
                          Owner: "Responsável",
                          Manager: "Responsável",
                          Member: "Colaborador",
                          Observer: "Observador",
                        } as Record<string, string>)[m.role] || m.role,
                      )}
                    </span>
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
                    {m.role !== "Owner" && <button
                      className="quiet delete"
                      disabled={busy}
                      onClick={() => void remove(m)}
                      aria-label={translate("Remover ") + m.name}
                    >
                      {translate("Remover")}{" "}
                    </button>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="feedback">
                <h2>{translate("Nenhum participante nesta seleção")}</h2>
                <p>{translate(demo ? "Revise a busca ou adicione uma pessoa à demonstração." : "Revise a busca ou adicione uma pessoa à equipe.")}</p>
              </div>
            )}
          </Feedback>
      </>
    </>
  );
}

type Invitation = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
};
