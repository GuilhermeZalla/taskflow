import { getLanguage } from "../i18n/core.ts";

const key = "taskflow.demo.v1";
export const isDemo = () => sessionStorage.getItem("taskflow.preview") === "true";
export function startDemo() {
  sessionStorage.setItem("taskflow.preview", "true");
}
const exampleDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0") +
    "T12:00:00Z"
  );
};
const initial = {
  workspaces: [
    {
      id: "studio",
      name: "Estúdio de produto",
      description: "Planejamento e entregas da equipe.",
      createdAt: "2026-11-01",
    },
  ],
  projects: [
    {
      id: "website",
      startDate: exampleDate(-4),
      dueDate: exampleDate(14),
      workspaceId: "studio",
      name: "Novo site institucional",
      description: "Uma experiência mais clara para apresentar o produto.",
      status: "Active",
    },
    {
      id: "app",
      startDate: exampleDate(-7),
      dueDate: exampleDate(10),
      workspaceId: "studio",
      name: "Experiência do aplicativo",
      description: "Melhorias nos principais fluxos de uso.",
      status: "Active",
    },
  ],
  tasks: [
    {
      id: "t1",
      dueDate: exampleDate(3),
      assignedToId: "camila",
      assignedToName: "Camila Nunes",
      projectId: "website",
      title: "Revisar a navegação principal",
      description: "Validar os caminhos entre as páginas com a equipe.",
      status: "InProgress",
      priority: "High",
    },
    {
      id: "t2",
      dueDate: exampleDate(7),
      assignedToId: "renato",
      assignedToName: "Renato Lima",
      projectId: "website",
      title: "Preparar conteúdo das páginas",
      description: "Organizar textos e materiais para publicação.",
      status: "ToDo",
      priority: "Medium",
    },
    {
      id: "t3",
      dueDate: exampleDate(10),
      projectId: "app",
      title: "Validar o fluxo de cadastro",
      description: "Conferir mensagens de orientação e estados de erro.",
      status: "ToDo",
      priority: "High",
    },
    {
      id: "t4",
      projectId: "app",
      title: "Definir estrutura dos formulários",
      description: "Documentar campos e comportamentos.",
      status: "Done",
      priority: "Low",
    },
  ],
};
export const demoStorageKey = key;
export type DemoMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
  workspaceName?: string;
};
export type DemoActivity = {
  id: string;
  resource: string;
  title: string;
  action: string;
  createdAt: string;
  actorName?: string;
};
export type UserNotification = {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  taskId?: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};
const seedMembers: DemoMember[] = [
  {
    id: "camila",
    name: "Camila Nunes",
    email: "camila@example.invalid",
    role: "Responsável",
    workspaceId: "studio",
  },
  {
    id: "renato",
    name: "Renato Lima",
    email: "renato@example.invalid",
    role: "Colaborador",
    workspaceId: "studio",
  },
];
const sampleCopy: Record<string, string> = {
  "Estúdio de produto": "Product studio",
  "Planejamento e entregas da equipe.": "Team planning and delivery.",
  "Novo site institucional": "New company website",
  "Uma experiência mais clara para apresentar o produto.":
    "A clearer way to introduce the product.",
  "Experiência do aplicativo": "App experience",
  "Melhorias nos principais fluxos de uso.": "Improvements to core user journeys.",
  "Revisar a navegação principal": "Review primary navigation",
  "Validar os caminhos entre as páginas com a equipe.": "Validate page journeys with the team.",
  "Preparar conteúdo das páginas": "Prepare page content",
  "Organizar textos e materiais para publicação.": "Organize copy and assets for publication.",
  "Validar o fluxo de cadastro": "Validate the sign-up flow",
  "Conferir mensagens de orientação e estados de erro.":
    "Review guidance messages and error states.",
  "Definir estrutura dos formulários": "Define form structure",
  "Documentar campos e comportamentos.": "Document fields and behavior.",
  "Camila Nunes": "Camila Nunes",
  "Renato Lima": "Renato Lima",
};
const portugueseCopy = Object.fromEntries(
  Object.entries(sampleCopy).map(([portuguese, english]) => [english, portuguese]),
);
function localizeSample(value: any): any {
  if (Array.isArray(value)) return value.map(localizeSample);
  if (!value || typeof value !== "object") return value;
  const copy = getLanguage() === "en" ? sampleCopy : portugueseCopy;
  return Object.fromEntries(
    Object.entries(value).map(([field, content]) => [
      field,
      typeof content === "string" &&
      ["name", "title", "description", "assignedToName"].includes(field)
        ? (copy[content] ?? content)
        : localizeSample(content),
    ]),
  );
}
export async function demoAdapter(config: any) {
  const db = JSON.parse(localStorage.getItem(key) || JSON.stringify(initial)) as Record<
    string,
    Array<Record<string, any>>
  >;
  db["members"] ??= seedMembers.map((m) => ({ ...m }));
  db["activities"] ??= [];
  const [kind, id] = (config.url || "").replace("/api/", "").split("/");
  if (!["workspaces", "projects", "tasks", "members", "activities", "notifications"].includes(kind))
    throw new Error("Recurso indisponível na demonstração.");
  db["notifications"] ??= [];
  const method = (config.method || "get").toLowerCase();
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  if (kind === "activities" && method !== "get") throw new Error("O histórico é somente leitura.");
  if (kind === "notifications" && id === "read-all" && method === "put") {
    for (const notification of db[kind]!) notification["isRead"] = true;
    localStorage.setItem(key, JSON.stringify(db));
    return { data: null, status: 204, statusText: "No Content", headers: {}, config };
  }
  let data: any = db[kind];
  let previous: any;
  if (id) {
    previous = db[kind]!.find((x) => x["id"] === id);
    if (!previous) throw new Error("Registro não encontrado.");
    data = previous;
  }
  if (kind === "members" && ["post", "put"].includes(method)) {
    if (
      !body?.name?.trim() ||
      !body?.email?.includes("@") ||
      !db["workspaces"]?.some((w) => w["id"] === body.workspaceId)
    )
      throw new Error("Informe nome, e-mail e um espaço válido.");
    if (
      db[kind]!.some((m) => m["email"].toLowerCase() === body.email.toLowerCase() && m["id"] !== id)
    )
      throw new Error("Este e-mail já está na equipe de demonstração.");
  }
  if (method === "post") {
    data = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    db[kind]!.push(data);
  }
  if (method === "put") {
    if (!id) throw new Error("Informe o registro a atualizar.");
    Object.assign(data, body, { updatedAt: new Date().toISOString() });
  }
  if (method === "delete") {
    if (!id) throw new Error("Informe o registro a excluir.");
    db[kind] = db[kind]!.filter((x) => x["id"] !== id);
    const projectIds =
      kind === "workspaces"
        ? db["projects"]!.filter((x) => x["workspaceId"] === id).map((x) => x["id"])
        : kind === "projects"
          ? [id]
          : [];
    if (projectIds.length) {
      db["tasks"] = db["tasks"]!.filter((x) => !projectIds.includes(x["projectId"]));
      db["projects"] = db["projects"]!.filter((x) => !projectIds.includes(x["id"]));
    }
    if (kind === "workspaces")
      db["members"] = db["members"]!.filter((x) => x["workspaceId"] !== id);
    if (kind === "members")
      for (const t of db["tasks"]!)
        if (t["assignedToId"] === id) {
          t["assignedToId"] = null;
          t["assignedToName"] = null;
        }
  }
  if (kind === "tasks" && ["post", "put"].includes(method)) {
    const member = db["members"]!.find((m) => m["id"] === data.assignedToId);
    data.assignedToName = member?.["name"] || null;
  }
  if (method !== "get") {
    db["activities"]!.unshift({
      id: crypto.randomUUID(),
      resource: kind,
      title: data?.title || data?.name || previous?.title || previous?.name || "Registro",
      action: method === "post" ? "criado" : method === "delete" ? "excluído" : "atualizado",
      createdAt: new Date().toISOString(),
    });
  }
  if (method === "get" && !id && config.params)
    data = data.filter((x: any) =>
      Object.entries(config.params).every(([k, v]) => !v || x[k] === v),
    );
  localStorage.setItem(key, JSON.stringify(db));
  return {
    data: method === "get" ? localizeSample(data) : data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}
