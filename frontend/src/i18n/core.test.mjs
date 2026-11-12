import test from "node:test";
import assert from "node:assert/strict";
import {
  getLanguage,
  getLocale,
  setLanguage,
  t,
  localizeError,
  subscribeLanguage,
} from "./core.ts";
import { english } from "./catalog.ts";
import { formatProjectDate, projectStatus } from "../features/projects/project-list.ts";
const storage = new Map();
Object.defineProperty(globalThis, "localStorage", {
  value: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
  configurable: true,
});
test("defaults to pt-BR, persists English, and rejects unsupported stored languages", () => {
  storage.clear();
  assert.equal(getLanguage(), "pt-BR");
  setLanguage("en");
  assert.equal(storage.get("taskflow.language"), "en");
  assert.equal(getLocale(), "en-US");
  storage.set("taskflow.language", "xx");
  assert.equal(getLanguage(), "pt-BR");
});
test("catalog switches UI strings and preserves unknown user content", () => {
  setLanguage("en");
  assert.equal(t("Projetos"), "Projects");
  assert.equal(t("Meu projeto particular"), "Meu projeto particular");
  assert.equal(t("{count} tarefa aberta", { count: 1 }), "1 open task");
  setLanguage("pt-BR");
  assert.equal(t("Projetos"), "Projetos");
});
test("language changes notify subscribers and cleanup removes them", () => {
  let calls = 0;
  const stop = subscribeLanguage(() => calls++);
  setLanguage("en");
  stop();
  setLanguage("pt-BR");
  assert.equal(calls, 1);
});
test("date presentation changes without changing API status values", () => {
  setLanguage("en");
  assert.equal(formatProjectDate("2026-11-14"), "11/14/2026");
  assert.equal(projectStatus("InProgress"), "active");
  setLanguage("pt-BR");
  assert.equal(formatProjectDate("2026-11-14"), "14/11/2026");
});
test("known errors are translated and unknown server errors use a safe English fallback", () => {
  setLanguage("en");
  assert.equal(localizeError("As senhas precisam ser iguais."), "Passwords must match.");
  assert.match(localizeError("unknown server error"), /Unable to complete/);
  setLanguage("pt-BR");
});
test("every catalog entry has a nonempty English translation and keeps placeholders", () => {
  for (const [key, value] of Object.entries(english)) {
    assert.ok(value.trim(), key);
    assert.deepEqual(key.match(/\{\w+\}/g) || [], value.match(/\{\w+\}/g) || [], key);
  }
});
