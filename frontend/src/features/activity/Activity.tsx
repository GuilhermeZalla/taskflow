import { getLocale, t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { isDemo, type DemoActivity } from "@/services/demo";
import { PageHeading, Feedback } from "@/components/ui/Shared";
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
  const query = useQuery({
    queryKey: ["activities"],
    queryFn: async () => (await api.get<DemoActivity[]>("/api/activities")).data,
  });
  const items = query.data?.filter(
    (activity) =>
      (!resource || activity.resource === resource) &&
      searchText(activity.title).includes(searchText(search)),
  );

  return (
    <>
      <PageHeading
        title={translate("Atividade")}
        description={translate("Um registro das mudanças que fizeram o trabalho avançar.")}
      />
      <p className="page-note">
        {translate(
          demo
            ? "Histórico local de ações na demonstração. Ações anteriores à existência desse registro não são reconstruídas."
            : "Histórico persistente das alterações registradas nos seus espaços de trabalho.",
        )}{" "}
      </p>
      <div className="toolbar">
        <label className="search">
          <span>{translate("Buscar atividade")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={translate("Nome do registro…")}
          />
        </label>
        <label>
          {translate("Tipo")} {" "}
          <select value={resource} onChange={(event) => setResource(event.target.value)}>
            <option value="">{translate("Todos os tipos")}</option>
            {Object.entries(names).map(([value, label]) => (
              <option key={value} value={value}>
                {translate(label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Feedback loading={query.isLoading} error={!!query.error} retry={query.refetch}>
        {items?.length ? (
          <ol className="activity-list">
            {items.map((activity) => (
              <li key={activity.id}>
                <span className="activity-point" aria-hidden="true" />
                <div>
                  <strong>{activity.title}</strong>
                  <p>
                    {translate(names[activity.resource] || "Registro")} · {translate(activity.action)}{" "}
                    {activity.actorName ? translate("por ") + activity.actorName : ""}
                  </p>
                </div>
                <time dateTime={activity.createdAt}>
                  {new Intl.DateTimeFormat(getLocale(), {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(activity.createdAt))}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <div className="feedback">
            <h2>{translate("Nenhuma atividade nesta seleção")}</h2>
            <p>
              {translate(
                "Crie ou atualize um registro para acompanhar as mudanças aqui.",
              )}{" "}
            </p>
          </div>
        )}
      </Feedback>
    </>
  );
}
