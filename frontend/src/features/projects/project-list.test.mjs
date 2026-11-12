import test from "node:test";
import assert from "node:assert/strict";
import { selectProjects, formatProjectDate, projectStatus } from "./project-list.ts";
const projects = [
  {
    id: "a",
    workspaceId: "one",
    name: "Árvore",
    description: "Experiência de cadastro",
    status: "Active",
    dueDate: "2026-11-20",
  },
  { id: "b", workspaceId: "two", name: "Beta", status: "Completed", dueDate: "2026-11-15" },
  { id: "c", workspaceId: "one", name: "Caderno", status: "Planning", dueDate: null },
];
const tasks = [
  { id: "t1", projectId: "a", title: "First", status: "Done", priority: "High" },
  { id: "t2", projectId: "a", title: "Second", status: "ToDo", priority: "High" },
];
const defaults = { workspaceId: "", search: "", status: "all", sort: "name" };
test("filters combine workspace, status and accent-insensitive search", () => {
  const result = selectProjects(projects, tasks, {
    ...defaults,
    workspaceId: "one",
    status: "active",
    search: " EXPERIENCIA ",
  });
  assert.deepEqual(
    result.items.map((x) => x.project.id),
    ["a"],
  );
  assert.equal(result.total, 2);
  assert.equal(result.items[0].percent, 50);
});
test("deadline sort puts undefined dates last and does not mutate source", () => {
  assert.deepEqual(
    selectProjects(projects, tasks, { ...defaults, sort: "deadline" }).items.map(
      (x) => x.project.id,
    ),
    ["b", "a", "c"],
  );
  assert.deepEqual(
    projects.map((x) => x.id),
    ["a", "b", "c"],
  );
});
test("progress uses actual tasks, not project status, and sorts deterministically", () => {
  const result = selectProjects(projects, tasks, { ...defaults, sort: "progress" });
  assert.equal(result.items[0].project.id, "a");
  assert.equal(result.items.find((x) => x.project.id === "b").total, 0);
  assert.equal(result.items.find((x) => x.project.id === "b").percent, 0);
});
test("empty search results, status aliases and missing dates remain explicit", () => {
  assert.equal(selectProjects(projects, tasks, { ...defaults, search: "missing" }).items.length, 0);
  assert.equal(projectStatus("in_progress"), "active");
  assert.equal(formatProjectDate(null), "Não definido");
  assert.equal(formatProjectDate("invalid"), "Não definido");
  assert.equal(formatProjectDate("2026-11-15"), "15/11/2026");
});
