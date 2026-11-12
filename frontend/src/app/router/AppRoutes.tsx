import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "src/features/dashboard/Home";
import { Login } from "src/features/auth/Login";
import { Register } from "src/features/auth/Register";
import { Layout } from "src/components/ui/Layout";
import { Workspaces } from "src/features/workspaces/Workspaces";
import { Projects } from "src/features/projects/Projects";
import { Tasks } from "src/features/tasks/Tasks";
import { CreateWorkspace } from "src/features/workspaces/CreateWorkspace";
import { CreateProject } from "src/features/projects/CreateProject";
import { CreateTask } from "src/features/tasks/CreateTask";

import { EntityForm } from "@/components/ui/EntityForm";
import { Teams } from "@/features/teams/Teams";
import { Calendar } from "@/features/calendar/Calendar";
import { Activity } from "@/features/activity/Activity";
import { Reports } from "@/features/reports/Reports";
import { Settings } from "@/features/settings/Settings";
function NotFound() {
  useLanguage();
  return (
    <div className="feedback">
      <h1>{translate("Página não encontrada")}</h1>
      <a href="/">{translate("Voltar ao início")}</a>
    </div>
  );
}
const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "", element: <Home /> },
      { path: "workspaces", element: <Workspaces /> },
      { path: "workspaces/create", element: <CreateWorkspace /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/create", element: <CreateProject /> },
      { path: "tasks", element: <Tasks /> },
      { path: "tasks/create", element: <CreateTask /> },
      { path: "tasks/:id/edit", element: <EntityForm kind="tasks" /> },
      { path: "projects/:id/edit", element: <EntityForm kind="projects" /> },
      { path: "workspaces/:id/edit", element: <EntityForm kind="workspaces" /> },
      { path: "teams", element: <Teams /> },
      { path: "calendar", element: <Calendar /> },
      { path: "activity", element: <Activity /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },

      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export { router };
export default function AppRoutes() {
  useLanguage();
  return <RouterProvider router={router} />;
}
