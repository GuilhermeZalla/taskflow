import test from "node:test";
import assert from "node:assert/strict";
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
  };
};
Object.defineProperty(globalThis, "localStorage", { value: memory(), configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: memory(), configurable: true });
const { isDemo, startDemo, demoAdapter } = await import("./demo.ts");
const { setLanguage } = await import("../i18n/core.ts");
test("preview requires explicit opt-in and does not create a real access token", () => {
  sessionStorage.clear();
  assert.equal(isDemo(), false);
  startDemo();
  assert.equal(isDemo(), true);
  assert.equal(localStorage.getItem("accessToken"), null);
});
test("preview creation, completion and deletion persist between requests", async () => {
  localStorage.clear();
  const created = await demoAdapter({
    url: "/api/tasks",
    method: "post",
    data: JSON.stringify({ title: "Validation", projectId: "website", status: "ToDo" }),
  });
  const id = created.data.id;
  assert.ok(id);
  await demoAdapter({ url: "/api/tasks/" + id, method: "put", data: { status: "Done" } });
  assert.equal(
    (await demoAdapter({ url: "/api/tasks", method: "get" })).data.find((t) => t.id === id).status,
    "Done",
  );
  await demoAdapter({ url: "/api/tasks/" + id, method: "delete" });
  assert.equal(
    (await demoAdapter({ url: "/api/tasks", method: "get" })).data.some((t) => t.id === id),
    false,
  );
});
test("project filters isolate tasks and empty filters retain all records", async () => {
  localStorage.clear();
  const filtered = await demoAdapter({
    url: "/api/tasks",
    method: "get",
    params: { projectId: "website" },
  });
  assert.ok(filtered.data.length);
  assert.ok(filtered.data.every((t) => t.projectId === "website"));
  assert.equal(
    (await demoAdapter({ url: "/api/tasks", method: "get", params: { projectId: "" } })).data
      .length,
    4,
  );
});
test("sample preview content follows the selected language without rewriting saved data", async () => {
  localStorage.clear();
  setLanguage("en");
  const english = await demoAdapter({ url: "/api/tasks", method: "get" });
  assert.equal(english.data[0].title, "Review primary navigation");
  assert.equal(english.data[0].assignedToName, "Camila Nunes");
  assert.equal(
    localStorage.getItem("taskflow.demo.v1").includes("Revisar a navegação principal"),
    true,
  );
  setLanguage("pt-BR");
  const portuguese = await demoAdapter({ url: "/api/tasks", method: "get" });
  assert.equal(portuguese.data[0].title, "Revisar a navegação principal");
  setLanguage("en");
});
test("unknown resources and nonexistent updates fail visibly", async () => {
  await assert.rejects(() => demoAdapter({ url: "/api/unknown", method: "get" }));
  await assert.rejects(() =>
    demoAdapter({ url: "/api/tasks/nonexistent", method: "put", data: { status: "Done" } }),
  );
});

test("detail reads and edits retain the same record and produce a local activity", async () => {
  localStorage.clear();
  const first = (await demoAdapter({ url: "/api/tasks/t1", method: "get" })).data;
  assert.equal(first.id, "t1");
  await demoAdapter({
    url: "/api/tasks/t1",
    method: "put",
    data: { title: "Revisado", dueDate: "2026-11-20T12:00:00Z" },
  });
  assert.equal((await demoAdapter({ url: "/api/tasks/t1", method: "get" })).data.title, "Revisado");
  const events = (await demoAdapter({ url: "/api/activities", method: "get" })).data;
  assert.equal(events.length, 1);
  assert.equal(events[0].title, "Revisado");
  await assert.rejects(() =>
    demoAdapter({ url: "/api/activities", method: "post", data: { title: "fake" } }),
  );
});
test("demo members reject duplicate email and removal clears task assignment", async () => {
  localStorage.clear();
  await demoAdapter({ url: "/api/tasks/t1", method: "put", data: { assignedToId: "camila" } });
  assert.equal(
    (await demoAdapter({ url: "/api/tasks/t1", method: "get" })).data.assignedToName,
    "Camila Nunes",
  );
  await assert.rejects(() =>
    demoAdapter({
      url: "/api/members",
      method: "post",
      data: { name: "Other", email: "camila@example.invalid", workspaceId: "studio" },
    }),
  );
  await demoAdapter({ url: "/api/members/camila", method: "delete" });
  assert.equal(
    (await demoAdapter({ url: "/api/tasks/t1", method: "get" })).data.assignedToId,
    null,
  );
});
test("deleting a demo workspace cascades its projects, tasks and members", async () => {
  localStorage.clear();
  await demoAdapter({ url: "/api/workspaces/studio", method: "delete" });
  for (const kind of ["projects", "tasks", "members"])
    assert.equal((await demoAdapter({ url: "/api/" + kind, method: "get" })).data.length, 0);
  await assert.rejects(() => demoAdapter({ url: "/api/tasks/t1", method: "get" }));
});
