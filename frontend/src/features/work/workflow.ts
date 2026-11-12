import { getLocale } from "../../i18n/core.ts";
export const normalize = (value: string) =>
  value.replaceAll("_", "").replaceAll(" ", "").toLowerCase();
export const taskStatus = (value: string) => {
  const key = normalize(value);
  return key === "completed" ? "done" : key;
};
export const completed = (value: string) => taskStatus(value) === "done";
export const priorityRank = (value: string) =>
  ({ urgent: 0, high: 1, medium: 2, low: 3 } as Record<string, number>)[normalize(value)] ?? 4;
export const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export function dateInput(value?: string | null) {
  return value?.slice(0, 10) || "";
}
export function isOverdue(value: string | null | undefined, status: string, now = new Date()) {
  if (!value || completed(status) || !Number.isFinite(Date.parse(value))) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(dateInput(value) + "T23:59:59") < today;
}
type Item = {
  title: string;
  description?: string | null;
  projectId: string;
  status: string;
  priority: string;
  dueDate?: string | null;
};
export function filterTasks<T extends Item>(
  tasks: T[],
  filters: { search: string; status: string; priority: string; projectId: string; sort: string },
) {
  const query = searchText(filters.search.trim());
  return tasks
    .filter(
      (t) =>
        (!query || searchText(t.title + " " + (t.description || "")).includes(query)) &&
        (!filters.projectId || t.projectId === filters.projectId) &&
        (filters.status === "all" || taskStatus(t.status) === filters.status) &&
        (filters.priority === "all" || normalize(t.priority) === filters.priority),
    )
    .sort((a, b) => {
      if (filters.sort === "priority")
        return (
          priorityRank(a.priority) - priorityRank(b.priority) ||
          a.title.localeCompare(b.title, getLocale())
        );
      if (filters.sort === "deadline") {
        const val = (v?: string | null) =>
          v && Number.isFinite(Date.parse(v)) ? Date.parse(v) : Infinity;
        const d = val(a.dueDate) - val(b.dueDate);
        if (d && !Number.isNaN(d)) return d;
      }
      return a.title.localeCompare(b.title, getLocale());
    });
}
export function calendarCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, i - offset + 1, 12));
}
