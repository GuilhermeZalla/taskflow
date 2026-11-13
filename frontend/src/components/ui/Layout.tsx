import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { api, handleApiError } from "@/services/api";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { isDemo } from "@/services/demo";
export function Layout() {
  useLanguage();
  const demo = isDemo();
  const location = useLocation();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const profile = useQuery({
    queryKey: ["profile"],
    enabled: !demo && !!localStorage.getItem("accessToken"),
    queryFn: async () => (await api.get<{ email: string; emailConfirmed: boolean }>("/api/auth/me")).data,
  });
  const restricted = !demo && profile.data?.emailConfirmed === false;
  const showPending = restricted && location.pathname !== "/settings";
  useEffect(() => {
    const update = () => {
      document.documentElement.dataset["density"] =
        localStorage.getItem("taskflow.density") || "comfortable";
    };
    update();
    window.addEventListener("taskflow-settings", update);
    return () => window.removeEventListener("taskflow-settings", update);
  }, []);
  if (!demo && !localStorage.getItem("accessToken")) return <Navigate to="/login" replace />;
  if (!demo && profile.isPending) return <div className="feedback">{translate("Carregando seu trabalho…")}</div>;
  if (!demo && profile.isError) return <div className="feedback"><p>{translate("Não foi possível carregar os dados")}</p><button className="button secondary" onClick={() => profile.refetch()}>{translate("Tentar novamente")}</button></div>;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        {translate("Pular para conteúdo")}{" "}
      </a>
      <Sidebar restricted={restricted} />
      <div className="main-shell">
        <Header restricted={restricted} />
        <main id="content" tabIndex={-1}>
          {showPending ? <section className="panel" style={{ maxWidth: 680, margin: "2rem auto", padding: "2rem" }}>
            <p className="eyebrow">{translate("CONFIRMAÇÃO DE E-MAIL")}</p>
            <h1>{translate("Confirme seu e-mail para acessar seu espaço de trabalho")}</h1>
            <p>{translate("Enviamos um link de confirmação para")} <strong>{profile.data?.email}</strong>. {translate("Confirme seu endereço para visualizar seus projetos e tarefas.")}</p>
            <div className="form-actions">
              <button className="button" disabled={sending} onClick={async () => {
                setSending(true); setMessage("");
                try { await api.post("/resendConfirmationEmail", { email: profile.data?.email }); setMessage(translate("Se a conta estiver aguardando confirmação, enviaremos outro link.")); }
                catch (error) { setMessage(handleApiError(error).message); }
                finally { setSending(false); }
              }}>{sending ? translate("Aguarde…") : translate("Reenviar e-mail")}</button>
              <button className="button secondary" disabled={profile.isFetching} onClick={async () => {
                const refreshed = await profile.refetch();
                if (refreshed.data?.emailConfirmed === false) setMessage(translate("Confirmação ainda pendente. Confira seu e-mail ou reenvie o link."));
              }}>{translate("Verificar confirmação")}</button>
              <Link className="button secondary" to="/settings">{translate("Preferências da conta")}</Link>
            </div>
            {message && <p role="status">{message}</p>}
          </section> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
