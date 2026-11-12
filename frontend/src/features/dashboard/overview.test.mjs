import test from "node:test";
import assert from "node:assert/strict";
import { summarizeOverview, formatDeadline } from "./overview.ts";
const projects = [
  { id: "a", workspaceId: "one", name: "Alpha", status: "Active" },
  { id: "b", workspaceId: "two", name: "Beta", status: "Completed" },
];
const tasks = [
  {
    id: "1",
    projectId: "a",
    title: "Medium",
    status: "ToDo",
    priority: "Medium",
    dueDate: "2026-11-21",
  },
  {
    id: "2",
    projectId: "a",
    title: "Done",
    status: "done",
    priority: "High",
    dueDate: "2026-11-01",
  },
  { id: "3", projectId: "b", title: "Complete", status: "Completed", priority: "High" },
  {
    id: "4",
    projectId: "a",
    title: "Urgent",
    status: "in_progress",
    priority: "Urgent",
    dueDate: "invalid",
  },
];
test("overview scopes counts and progress to the selected workspace", () => {
  const result = summarizeOverview(projects, tasks, "one");
  assert.equal(result.projects.length, 1);
  assert.equal(result.tasks.length, 3);
  assert.equal(result.completed, 1);
  assert.equal(result.open, 2);
  assert.equal(result.progress[0].percent, 33);
  assert.deepEqual(
    result.priorities.map((t) => t.id),
    ["4", "1"],
  );
});
test("deadlines exclude completed tasks, completed projects and invalid dates", () => {
  assert.deepEqual(
    summarizeOverview(projects, tasks).deadlines.map((t) => t.id),
    ["1"],
  );
});
test("empty workspaces and projects without tasks do not invent progress", () => {
  assert.equal(summarizeOverview(projects, []).progress[0].percent, 0);
  assert.deepEqual(summarizeOverview(projects, tasks, "missing").progress, []);
  assert.equal(summarizeOverview(projects, tasks).activeProjects, 1);
});
test("summary never reorders the input and formats date-only deadlines on their calendar day", () => {
  summarizeOverview(projects, tasks);
  assert.equal(tasks[0].id, "1");
  assert.match(formatDeadline("2026-11-21"), /21/);
});
