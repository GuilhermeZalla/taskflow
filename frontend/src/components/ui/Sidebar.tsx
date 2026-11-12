import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
const items = [
  ["/", "Visão geral", "overview"],
  ["/workspaces", "Espaços de trabalho", "space"],
  ["/projects", "Projetos", "project"],
  ["/tasks", "Tarefas", "task"],
  ["/teams", "Equipes", "team"],
  ["/calendar", "Calendário", "calendar"],
  ["/activity", "Atividade", "activity"],
  ["/reports", "Relatórios", "report"],
];
export function Sidebar() {
  useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            t.
          </span>
          TaskFlow
        </NavLink>
        <button
          className="mobile-menu-toggle button secondary"
          aria-controls="main-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {translate("Menu")}{" "}
        </button>
      </div>
      <p className="nav-label">{translate("ORGANIZAÇÃO")}</p>
      <nav
        id="main-navigation"
        aria-label={translate("Navegação principal")}
        className={open ? "mobile-open" : ""}
      >
        {items.map(([path, label, icon]) => (
          <NavLink key={path} to={path!} end={path === "/"} onClick={() => setOpen(false)}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              {icon === "task" ? (
                <path d="m4 6 2 2 4-4M12 6h8M4 14h4v5H4zM12 16h8" />
              ) : icon === "overview" ? (
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
              ) : icon === "calendar" ? (
                <path d="M4 5h16v15H4zM8 3v5M16 3v5M4 10h16" />
              ) : icon === "team" ? (
                <>
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" />
                </>
              ) : icon === "report" ? (
                <path d="M4 20V9h4v11M10 20V4h4v16M16 20v-8h4v8" />
              ) : icon === "activity" ? (
                <path d="m2 12 5 0 3-8 4 16 3-8h5" />
              ) : (
                <path d="M3 6h7l2 3h9v11H3zM3 6V4h7l2 2" />
              )}
            </svg>
            <span>{translate(label || "")}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={"mobile-settings " + (location.pathname === "/settings" ? "active" : "")}
          onClick={() => setOpen(false)}
        >
          {translate("Preferências")}{" "}
        </NavLink>
      </nav>
      <div className="sidebar-foot">
        <NavLink to="/settings">{translate("Preferências da conta →")}</NavLink>
        <small>{translate("Organize. Priorize. Entregue.")}</small>
      </div>
    </aside>
  );
}
