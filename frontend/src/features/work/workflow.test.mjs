import test from "node:test";
import assert from "node:assert/strict";
import { filterTasks, calendarCells, isOverdue, taskStatus } from "./workflow.ts";
const tasks = [
  {
    title: "Revisão",
    description: "CADASTRO",
    projectId: "a",
    status: "Completed",
    priority: "Low",
    dueDate: "2026-12-01",
  },
  { title: "Urgente", projectId: "a", status: "InProgress", priority: "Urgent", dueDate: null },
  { title: "Outro", projectId: "b", status: "ToDo", priority: "High", dueDate: "2026-11-10" },
];
const defaults = { search: "", projectId: "", status: "all", priority: "all", sort: "priority" };
test("task filters combine accents, descriptions, status aliases and project", () => {
  assert.deepEqual(
    filterTasks(tasks, { ...defaults, search: "cadastro", projectId: "a", status: "done" }).map(
      (t) => t.title,
    ),
    ["Revisão"],
  );
  assert.equal(taskStatus("in_progress"), "inprogress");
});
test("priority and deadline ordering do not mutate original data", () => {
  assert.equal(filterTasks(tasks, defaults)[0].title, "Urgente");
  assert.equal(filterTasks(tasks, { ...defaults, sort: "deadline" })[2].title, "Urgente");
  assert.equal(tasks[0].title, "Revisão");
});
test("overdue respects local calendar, completion, invalid dates and today", () => {
  const now = new Date(2026, 10, 11, 12);
  assert.equal(isOverdue("2026-11-10", "ToDo", now), true);
  assert.equal(isOverdue("2026-11-11", "ToDo", now), false);
  assert.equal(isOverdue("2026-11-10", "Completed", now), false);
  assert.equal(isOverdue("bad", "ToDo", now), false);
});
test("calendar aligns Monday first, includes leap day, and crosses years", () => {
  const days = calendarCells(2028, 1);
  assert.equal(days.length, 42);
  assert.equal(days[0].getDay(), 1);
  assert.ok(days.some((d) => d.getMonth() === 1 && d.getDate() === 29));
  const jan = calendarCells(2027, 0);
  assert.ok(jan.some((d) => d.getFullYear() === 2026));
});
