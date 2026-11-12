import { getLocale, t } from "../../i18n/core.ts";
import { summarizeOverview } from "../dashboard/overview.ts";
export const projectStatus = (value: string) => {
  const key = value.replaceAll("_", "").replaceAll(" ", "").toLowerCase();
  if (["active", "inprogress"].includes(key)) return "active";
  if (["completed", "done"].includes(key)) return "completed";
  if (["cancelled", "canceled"].includes(key)) return "cancelled";
  if (["onhold", "paused"].includes(key)) return "paused";
  return key;
};
export const projectStatusLabel = (value: string) =>
  (
    {
      active: t("Em andamento"),
      completed: t("Concluído"),
      cancelled: t("Cancelado"),
      paused: t("Pausado"),
      planning: t("Planejamento"),
      review: t("Em revisão"),
    } as Record<string, string>
  )[projectStatus(value)] || value;
const searchable = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
type ProjectRecord = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
};
type TaskRecord = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
};
export function selectProjects<P extends ProjectRecord, T extends TaskRecord>(
  projects: P[],
  tasks: T[],
  filters: { workspaceId: string; search: string; status: string; sort: string },
) {
  const scoped = summarizeOverview(projects, tasks, filters.workspaceId).progress;
  const search = searchable(filters.search.trim());
  const items = scoped.filter(
    ({ project }) =>
      (!search || searchable(project.name + " " + (project.description || "")).includes(search)) &&
      (filters.status === "all" || projectStatus(project.status) === filters.status),
  );
  items.sort((a, b) => {
    if (filters.sort === "progress")
      return b.percent - a.percent || a.project.name.localeCompare(b.project.name, getLocale());
    if (filters.sort === "deadline") {
      const date = (value?: string | null) =>
        value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : Infinity;
      const difference = date(a.project.dueDate) - date(b.project.dueDate);
      if (difference && !Number.isNaN(difference)) return difference;
    }
    return a.project.name.localeCompare(b.project.name, getLocale());
  });
  return { items, total: scoped.length };
}
export function formatProjectDate(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return t("Não definido");
  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T12:00:00" : value));
}
