import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeading, Feedback, action, statusLabel } from "./Shared";
type Item = { id: string; name: string; description?: string; status?: string };
export function ResourceList({ kind }: { kind: "projects" | "workspaces" }) {
  useLanguage();
  const projects = kind === "projects";
  const [params] = useSearchParams();
  const workspaceId = params.get("workspaceId") || "";
  const query = useQuery({
    queryKey: ["/api/" + kind, workspaceId],
    retry: 1,
    queryFn: async () =>
      (await api.get<Item[]>("/api/" + kind, { params: projects ? { workspaceId } : {} })).data,
  });
  return (
    <>
      <PageHeading
        title={projects ? translate("Projetos") : translate("Espaços de trabalho")}
        description={
          projects
            ? "Frentes de trabalho com um objetivo em comum."
            : "Um lugar para reunir seus projetos e dar contexto às entregas."
        }
        action={action(
          "/" + kind + "/create",
          projects ? translate("Novo projeto") : translate("Novo espaço"),
        )}
      />
      <Feedback
        loading={query.isLoading}
        error={!!query.error}
        retry={query.refetch}
        empty={!query.data?.length}
      >
        <section className="resource-list">
          {query.data?.map((item, i) => (
            <Link
              key={item.id}
              className="resource-row"
              to={projects ? "/tasks?projectId=" + item.id : "/projects?workspaceId=" + item.id}
            >
              <span className="resource-index">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2>{item.name}</h2>
                <p>{item.description || translate("Sem descrição adicionada.")}</p>
              </div>
              {item.status && <span className="badge">{statusLabel(item.status)}</span>}
              <span className="row-link">
                {projects ? translate("Ver tarefas") : translate("Ver projetos")} →
              </span>
            </Link>
          ))}
        </section>
      </Feedback>
    </>
  );
}
