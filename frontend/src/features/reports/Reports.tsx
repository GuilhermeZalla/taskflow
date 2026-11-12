import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeading, Feedback } from "@/components/ui/Shared";
import { useWorkData } from "@/features/work/useWorkData";
import { summarizeOverview } from "@/features/dashboard/overview";
import { isOverdue, completed } from "@/features/work/workflow";
export function Reports() {
  useLanguage();
  const q = useWorkData();
  const [workspace, setWorkspace] = useState("");
  const report = summarizeOverview(q.data?.projects || [], q.data?.tasks || [], workspace);
  const overdue = report.tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const rate = report.tasks.length ? Math.round((report.completed / report.tasks.length) * 100) : 0;
  const workload = new Map<string, { name: string; open: number; done: number }>();
  for (const t of report.tasks) {
    const id = t.assignedToId || "unassigned";
    const group = workload.get(id) || {
      name:
        t.assignedToName ||
        (!t.assignedToId
          ? translate("Sem responsável")
          : translate("Responsável identificado pela API")),
      open: 0,
      done: 0,
    };
    if (completed(t.status)) group.done++;
    else group.open++;
    workload.set(id, group);
  }
  return (
    <>
      <PageHeading
        title={translate("Relatórios")}
        description={translate("Progresso e carga de trabalho a partir dos registros atuais.")}
      />
      <label className="report-scope">
        {translate("Espaço de trabalho")}{" "}
        <select value={workspace} onChange={(e) => setWorkspace(e.target.value)}>
          <option value="">{translate("Todos os espaços")}</option>
          {q.data?.spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <Feedback loading={q.isLoading} error={!!q.error} retry={q.refetch}>
        <div className="metrics overview-metrics">
          {[
            [translate("Tarefas"), report.tasks.length],
            [translate("Concluídas"), report.completed],
            [translate("Taxa de conclusão"), report.tasks.length ? rate + "%" : "—"],
            [translate("Prazo vencido"), overdue.length],
          ].map(([l, v]) => (
            <div className="metric" key={l}>
              <span>{l}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <div className="report-grid">
          <section>
            <h2>{translate("Progresso por projeto")}</h2>
            {report.progress.length ? (
              report.progress.map(({ project, total, completed, percent }) => (
                <Link
                  className="report-project"
                  to={"/tasks?projectId=" + project.id}
                  key={project.id}
                >
                  <strong>{project.name}</strong>
                  <span>
                    {total
                      ? completed +
                        translate(" de ") +
                        total +
                        translate(" concluídas · ") +
                        percent +
                        "%"
                      : translate("Sem tarefas cadastradas")}
                  </span>
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
                </Link>
              ))
            ) : (
              <p className="feedback">{translate("Nenhum projeto neste espaço.")}</p>
            )}
          </section>
          <section>
            <h2>{translate("Distribuição de tarefas")}</h2>
            {workload.size ? (
              <div className="workload-list">
                {[...workload].map(([id, w]) => (
                  <div key={id}>
                    <strong>{w.name}</strong>
                    <span>
                      {w.open} {translate("abertas ·")} {w.done} {translate("concluídas")}{" "}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="feedback">{translate("Nenhuma tarefa para analisar.")}</p>
            )}
            <p className="page-note">
              {translate(
                "Participantes sem tarefas não entram nesta distribuição. Não há estimativa automática de horas ou produtividade.",
              )}{" "}
            </p>
          </section>
        </div>
        <section className="deadline-section">
          <h2>{translate("Tarefas com prazo vencido")}</h2>
          {overdue.length ? (
            overdue.map((t) => (
              <Link className="deadline-row" key={t.id} to={"/tasks/" + t.id + "/edit"}>
                <div>
                  <strong>{t.title}</strong>
                  <small>{q.data?.projects.find((p) => p.id === t.projectId)?.name}</small>
                </div>
                <span>{translate("Revisar prazo →")}</span>
              </Link>
            ))
          ) : (
            <p className="deadline-empty">
              {translate("Nenhuma tarefa em aberto com prazo vencido neste espaço.")}{" "}
            </p>
          )}
        </section>
      </Feedback>
    </>
  );
}
