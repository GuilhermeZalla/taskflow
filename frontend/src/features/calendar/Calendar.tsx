import { getLocale } from "@/i18n/core";
import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeading, Feedback } from "@/components/ui/Shared";
import { useWorkData } from "@/features/work/useWorkData";
import { calendarCells, dateInput, completed } from "@/features/work/workflow";
import { formatProjectDate, projectStatus } from "@/features/projects/project-list";
export function Calendar() {
  useLanguage();
  const q = useWorkData();
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1, 12)),
    [selected, setSelected] = useState(""),
    [kind, setKind] = useState("all"),
    [includeDone, setIncludeDone] = useState(false);
  const dateKey = (date: Date) =>
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  const events = [
    ...(q.data?.tasks || [])
      .filter(
        (t) =>
          t.dueDate &&
          Number.isFinite(Date.parse(t.dueDate)) &&
          (includeDone || !completed(t.status)),
      )
      .map((t) => ({
        id: "task-" + t.id,
        type: "task",
        date: dateInput(t.dueDate),
        title: t.title,
        to: "/tasks/" + t.id + "/edit",
      })),
    ...(q.data?.projects || [])
      .filter(
        (p) =>
          p.dueDate &&
          Number.isFinite(Date.parse(p.dueDate)) &&
          projectStatus(p.status) !== "cancelled" &&
          (includeDone || projectStatus(p.status) !== "completed"),
      )
      .map((p) => ({
        id: "project-" + p.id,
        type: "project",
        date: dateInput(p.dueDate),
        title: p.name,
        to: "/projects/" + p.id + "/edit",
      })),
  ].filter((e) => kind === "all" || e.type === kind);
  const monthEvents = events
    .filter((e) => e.date.startsWith(dateKey(month).slice(0, 7)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const visible = selected ? monthEvents.filter((e) => e.date === selected) : monthEvents;
  function changeMonth(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1, 12));
    setSelected("");
  }
  return (
    <>
      <PageHeading
        title={translate("Calendário")}
        description={translate("Datas de entrega dos projetos e tarefas, sem perder o contexto.")}
      />
      <div className="calendar-toolbar">
        <div className="month-navigation">
          <button
            className="button secondary"
            aria-label={translate("Mês anterior")}
            onClick={() => changeMonth(-1)}
          >
            ←
          </button>
          <h2 aria-live="polite">
            {new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(month)}
          </h2>
          <button
            className="button secondary"
            aria-label={translate("Próximo mês")}
            onClick={() => changeMonth(1)}
          >
            →
          </button>
          <button
            className="quiet"
            onClick={() => {
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12));
              setSelected("");
            }}
          >
            {translate("Hoje")}{" "}
          </button>
        </div>
        <label>
          {translate("Exibir")}{" "}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">{translate("Projetos e tarefas")}</option>
            <option value="task">{translate("Tarefas")}</option>
            <option value="project">{translate("Projetos")}</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={includeDone}
            onChange={(e) => setIncludeDone(e.target.checked)}
          />
          {translate("Incluir concluídos")}{" "}
        </label>
      </div>
      <Feedback loading={q.isLoading} error={!!q.error} retry={q.refetch}>
        <div className="calendar-layout">
          <section aria-label={translate("Datas do mês")} className="calendar-month">
            <div className="calendar-week">
              {[
                translate("Seg"),
                translate("Ter"),
                translate("Qua"),
                translate("Qui"),
                translate("Sex"),
                translate("Sáb"),
                translate("Dom"),
              ].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {calendarCells(month.getFullYear(), month.getMonth()).map((date) => {
                const key = dateKey(date),
                  items = events.filter((e) => e.date === key),
                  outside = date.getMonth() !== month.getMonth();
                return (
                  <button
                    key={key}
                    className={
                      "calendar-day " +
                      (outside ? "outside " : "") +
                      (key === dateKey(now) ? "today " : "") +
                      (selected === key ? "selected" : "")
                    }
                    aria-label={
                      formatProjectDate(key) +
                      ", " +
                      translate(items.length === 1 ? "{count} entrega" : "{count} entregas", {
                        count: items.length,
                      })
                    }
                    aria-pressed={selected === key}
                    onClick={() => {
                      if (outside) setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12));
                      setSelected(key);
                    }}
                  >
                    <time dateTime={key}>{date.getDate()}</time>
                    {items.slice(0, 2).map((e) => (
                      <span className={"calendar-event " + e.type} key={e.id}>
                        {e.title}
                      </span>
                    ))}
                    {items.length > 2 && (
                      <small>
                        +{items.length - 2} {translate("entregas")}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
          <aside className="calendar-agenda">
            <div className="section-heading">
              <h2>{selected ? formatProjectDate(selected) : translate("Entregas do mês")}</h2>
              {selected && (
                <button className="quiet" onClick={() => setSelected("")}>
                  {translate("Ver mês")}{" "}
                </button>
              )}
            </div>
            {visible.length ? (
              visible.map((e) => (
                <Link className="agenda-item" key={e.id} to={e.to}>
                  <time dateTime={e.date}>{formatProjectDate(e.date)}</time>
                  <strong>{e.title}</strong>
                  <small>
                    {e.type === "task" ? translate("Tarefa") : translate("Projeto")}{" "}
                    {translate("· Abrir →")}
                  </small>
                </Link>
              ))
            ) : (
              <div className="overview-empty">
                <h3>{translate("Nenhuma entrega nesta seleção")}</h3>
                <p>
                  {translate(
                    "Defina um prazo no formulário do projeto ou da tarefa para vê-lo no calendário.",
                  )}{" "}
                </p>
                <Link to="/tasks/create">{translate("Criar tarefa →")}</Link>
              </div>
            )}
          </aside>
        </div>
      </Feedback>
    </>
  );
}
