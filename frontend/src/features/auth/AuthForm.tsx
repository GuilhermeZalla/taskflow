import { LanguageSelector } from "@/i18n/react";
import { t as translate, localizeError } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/services/api";
import { startDemo } from "@/services/demo";
export function AuthForm({ register = false }: { register?: boolean }) {
  useLanguage();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const cache = useQueryClient();
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Link className="brand" to="/login">
          <span className="brand-mark">t.</span>TaskFlow
        </Link>
        <div>
          <p className="eyebrow">{translate("MENOS DISPERSÃO. MAIS DIREÇÃO.")}</p>
          <h1>
            {translate("Seu trabalho,")} <br />
            {translate("com um próximo passo.")}{" "}
          </h1>
          <p>
            {translate(
              "Reúna projetos, organize prioridades e acompanhe as entregas em um só lugar.",
            )}
          </p>
          <div className="auth-steps">
            <span>
              01 <strong>{translate("Organize o contexto")}</strong>
            </span>
            <span>
              02 <strong>{translate("Defina as prioridades")}</strong>
            </span>
            <span>
              03 <strong>{translate("Acompanhe o progresso")}</strong>
            </span>
          </div>
        </div>
        <small>{translate("Projetos e tarefas, com clareza.")}</small>
      </section>
      <main className="auth-form-area">
        <div className="auth-language">
          <LanguageSelector />
        </div>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage("");
            setError("");
            if (register && password !== confirm) {
              setError("As senhas precisam ser iguais.");
              return;
            }
            setBusy(true);
            try {
              if (register) {
                await api.post("/api/auth/register", { fullName, email, password });
                setMessage("Conta criada. Entre com seu e-mail e senha.");
                setFullName("");
                setPassword("");
                setConfirm("");
              } else {
                const response = await api.post("/login", { email, password });
                const token = (response.data as { accessToken?: string }).accessToken;
                if (!token) throw new Error("A API não retornou uma sessão válida.");
                sessionStorage.removeItem("taskflow.preview");
                localStorage.setItem("accessToken", token);
                cache.clear();
                navigate("/");
              }
            } catch (e) {
              setError(handleApiError(e).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="eyebrow">
            {register ? translate("COMECE POR AQUI") : translate("BOM TER VOCÊ DE VOLTA")}
          </p>
          <h2>{register ? translate("Criar sua conta") : translate("Entrar no TaskFlow")}</h2>
          <p className="muted">
            {register
              ? translate("Prepare seu espaço para organizar o trabalho.")
              : translate("Acesse seus projetos e continue de onde parou.")}
          </p>
          {register && (
            <label>
              {translate("Nome completo")} {" "}
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                required
                maxLength={200}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          )}
          <label>
            {translate("E-mail")}{" "}
            <input
              type="email"
              autoComplete="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder={translate("voce@empresa.com")}
            />
          </label>
          <label>
            {translate("Senha")}{" "}
            <div className="password-field">
              <input
                type={visible ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                value={password}
                required
                minLength={register ? 8 : 1}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="quiet"
                aria-label={visible ? translate("Ocultar senha") : translate("Mostrar senha")}
                onClick={() => setVisible(!visible)}
              >
                {visible ? translate("Ocultar") : translate("Mostrar")}
              </button>
            </div>
          </label>
          {register && (
            <>
              <small className="muted">
                {translate(
                  "Use pelo menos 8 caracteres, com maiúsculas, minúsculas e números.",
                )}{" "}
              </small>
              <label>
                {translate("Confirmar senha")}{" "}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  required
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="error">
              {localizeError(error)}
            </p>
          )}
          {message && (
            <p role="status" className="success">
              {translate(message)}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? translate("Aguarde…")
              : register
                ? translate("Criar conta")
                : translate("Entrar")}
          </button>
          <p className="auth-switch">
            {register ? translate("Já tem uma conta?") : translate("Ainda não tem conta?")}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? translate("Entrar") : translate("Criar conta")}
            </Link>
          </p>
          <div className="demo-entry">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                startDemo();
                cache.clear();
                navigate("/");
              }}
            >
              {translate("Explorar demonstração")}{" "}
            </button>
            <small>{translate("Dados fictícios, salvos apenas neste navegador.")}</small>
          </div>
        </form>
      </main>
    </div>
  );
}
