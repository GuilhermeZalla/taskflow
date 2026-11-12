import { getLocale } from "../../i18n/core.ts";
type ProjectRecord = {
  id: string;
  workspaceId: string;
  status: string;
  name: string;
  dueDate?: string | null;
};
type TaskRecord = {
  id: string;
  projectId: string;
  status: string;
  priority: string;
  title: string;
  dueDate?: string | null;
};
const normalize = (value: string) => value.replaceAll("_", "").replaceAll(" ", "").toLowerCase();
export const isCompleted = (status: string) => ["done", "completed"].includes(normalize(status));
const rank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const dateValue = (value?: string | null) => (value ? Date.parse(value) : NaN);
export function summarizeOverview<P extends ProjectRecord, T extends TaskRecord>(
  projects: P[],
  tasks: T[],
  workspaceId = "",
) {
  const selectedProjects = workspaceId
    ? projects.filter((p) => p.workspaceId === workspaceId)
    : projects;
  const ids = new Set(selectedProjects.map((p) => p.id));
  const selectedTasks = workspaceId ? tasks.filter((t) => ids.has(t.projectId)) : tasks;
  const completed = selectedTasks.filter((t) => isCompleted(t.status));
  const open = selectedTasks.filter((t) => !isCompleted(t.status));
  const priorities = [...open].sort(
    (a, b) =>
      (rank[normalize(a.priority)] ?? 4) - (rank[normalize(b.priority)] ?? 4) ||
      (Number.isFinite(dateValue(a.dueDate)) ? dateValue(a.dueDate) : Infinity) -
        (Number.isFinite(dateValue(b.dueDate)) ? dateValue(b.dueDate) : Infinity),
  );
  const deadlines = [
    ...open
      .filter((t) => Number.isFinite(dateValue(t.dueDate)))
      .map((t) => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        date: t.dueDate!,
        projectId: t.projectId,
      })),
    ...selectedProjects
      .filter(
        (p) =>
          !["completed", "done", "cancelled"].includes(normalize(p.status)) &&
          Number.isFinite(dateValue(p.dueDate)),
      )
      .map((p) => ({
        id: p.id,
        type: "project" as const,
        title: p.name,
        date: p.dueDate!,
        projectId: p.id,
      })),
  ].sort((a, b) => dateValue(a.date) - dateValue(b.date));
  const progress = selectedProjects.map((project) => {
    const items = selectedTasks.filter((t) => t.projectId === project.id);
    const done = items.filter((t) => isCompleted(t.status)).length;
    return {
      project,
      total: items.length,
      completed: done,
      percent: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  });
  return {
    projects: selectedProjects,
    tasks: selectedTasks,
    completed: completed.length,
    open: open.length,
    activeProjects: selectedProjects.filter(
      (p) => !["completed", "done", "cancelled"].includes(normalize(p.status)),
    ).length,
    priorities,
    deadlines,
    progress,
  };
}
export function formatDeadline(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date(value);
  return new Intl.DateTimeFormat(getLocale(), { day: "2-digit", month: "short" }).format(date);
}
