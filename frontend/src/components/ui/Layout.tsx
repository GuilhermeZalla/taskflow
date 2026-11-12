import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { isDemo } from "@/services/demo";
export function Layout() {
  useLanguage();
  useEffect(() => {
    const update = () => {
      document.documentElement.dataset["density"] =
        localStorage.getItem("taskflow.density") || "comfortable";
    };
    update();
    window.addEventListener("taskflow-settings", update);
    return () => window.removeEventListener("taskflow-settings", update);
  }, []);
  if (!isDemo() && !localStorage.getItem("accessToken")) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        {translate("Pular para conteúdo")}{" "}
      </a>
      <Sidebar />
      <div className="main-shell">
        <Header />
        <main id="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
