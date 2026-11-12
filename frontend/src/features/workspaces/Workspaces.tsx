import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { Link } from "react-router-dom";
import { useWorkData } from "@/features/work/useWorkData";
import { PageHeading, Feedback, action } from "@/components/ui/Shared";
export function Workspaces() {
  useLanguage();
  const q = useWorkData();
  return (
    <>
      <PageHeading
        title={translate("Espaços de trabalho")}
        description={translate("Separe contextos e reúna os projetos de cada equipe.")}
        action={action("/workspaces/create", translate("Novo espaço"))}
      />
      <Feedback loading={q.isLoading} error={!!q.error} retry={q.refetch}>
        {q.data?.spaces.length ? (
          <section className="resource-list">
            {q.data.spaces.map((s, i) => (
              <article className="resource-row" key={s.id}>
                <span className="resource-index">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2>
                    <Link to={"/projects?workspaceId=" + s.id}>{s.name}</Link>
                  </h2>
                  <p>{s.description || translate("Sem descrição adicionada.")}</p>
                  <small>
                    {q.data.projects.filter((p) => p.workspaceId === s.id).length}{" "}
                    {translate("projetos neste espaço")}{" "}
                  </small>
                </div>
                <Link
                  className="quiet"
                  to={"/workspaces/" + s.id + "/edit"}
                  aria-label={translate("Editar ") + s.name}
                >
                  {translate("Editar")}{" "}
                </Link>
                <Link className="row-link" to={"/projects?workspaceId=" + s.id}>
                  {translate("Ver projetos →")}{" "}
                </Link>
              </article>
            ))}
          </section>
        ) : (
          <div className="feedback">
            <h2>{translate("Seu trabalho precisa de um espaço")}</h2>
            <p>{translate("Crie uma área para reunir os primeiros projetos.")}</p>
            {action("/workspaces/create", translate("Criar espaço"))}
          </div>
        )}
      </Feedback>
    </>
  );
}
