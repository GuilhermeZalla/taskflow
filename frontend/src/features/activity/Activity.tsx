import { getLocale } from "@/i18n/core";
import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { isDemo, type DemoActivity } from "@/services/demo";
import { PageHeading, Feedback } from "@/components/ui/Shared";
import { IntegrationNotice } from "@/components/ui/IntegrationNotice";
import { searchText } from "@/features/work/workflow";
const names: Record<string, string> = {
  tasks: "Tarefa",
  projects: "Projeto",
  workspaces: "Espaço",
  members: "Participante",
};
export function Activity() {
  useLanguage();
  const demo = isDemo();
  const [search, setSearch] = useState(""),
    [resource, setResource] = useState("");
  const q = useQuery({
    queryKey: ["demo-activities"],
    enabled: demo,
    queryFn: async () => (await api.get<DemoActivity[]>("/api/activities")).data,
  });
  const items = q.data?.filter(
    (a) =>
      (!resource || a.resource === resource) && searchText(a.title).includes(searchText(search)),
  );
  return (
    <>
      <PageHeading
        title={translate("Atividade")}
        description={translate("Um registro das mudanças que fizeram o trabalho avançar.")}
      />
      {!demo ? (
        <IntegrationNotice>
          {translate(
            "O backend ainda não expõe o histórico de atividades. Esta tela não infere alterações passadas a partir de datas de cadastro. Na demonstração, as ações realizadas são registradas localmente.",
          )}{" "}
        </IntegrationNotice>
      ) : (
        <>
          <p className="page-note">
            {translate(
              "Histórico local de ações na demonstração. Ações anteriores à existência desse registro não são reconstruídas.",
            )}{" "}
          </p>
          <div className="toolbar">
            <label className="search">
              {translate("Buscar atividade")}{" "}
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={translate("Nome do registro…")}
              />
            </label>
            <label>
              {translate("Tipo")}{" "}
              <select value={resource} onChange={(e) => setResource(e.target.value)}>
                <option value="">{translate("Todos os tipos")}</option>
                {Object.entries(names).map(([v, l]) => (
                  <option key={v} value={v}>
                    {translate(l)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Feedback loading={q.isLoading} error={!!q.error} retry={q.refetch}>
            {items?.length ? (
              <ol className="activity-list">
                {items.map((a) => (
                  <li key={a.id}>
                    <span className="activity-point" aria-hidden="true" />
                    <div>
                      <strong>{a.title}</strong>
                      <p>
                        {translate(names[a.resource] || "Registro")} · {translate(a.action)}{" "}
                        {translate("por você na demonstração")}{" "}
                      </p>
                    </div>
                    <time dateTime={a.createdAt}>
                      {new Intl.DateTimeFormat(getLocale(), {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(a.createdAt))}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="feedback">
                <h2>{translate("Nenhuma atividade nesta seleção")}</h2>
                <p>
                  {translate(
                    "Crie ou atualize um registro na demonstração para acompanhar as mudanças aqui.",
                  )}{" "}
                </p>
              </div>
            )}
          </Feedback>
        </>
      )}
    </>
  );
}
