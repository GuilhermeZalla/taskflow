import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, handleApiError } from "@/services/api";
import { t as translate, localizeError } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";

const pendingInvitationKey = "taskflow.pendingInvitation";

function EmailFlowLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  useLanguage();
  return (
    <div className={`auth-shell email-flow-shell ${className}`.trim()}>
      <main className="auth-form-area">
        <section className="auth-form">
          <Link className="brand" to="/login">
            <span className="brand-mark">t.</span>TaskFlow
          </Link>
          {children}
        </section>
      </main>
    </div>
  );
}

function EmailFlowReturnLink() {
  return (
    <p className="auth-switch email-flow-return">
      <Link className="button secondary email-flow-back" to="/login">
        <span aria-hidden="true">←</span>
        {translate("Voltar para entrar")}
      </Link>
    </p>
  );
}

export function ConfirmEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [credentials] = useState(() => ({ userId: params.get("userId"), code: params.get("code") }));
  const { userId, code } = credentials;
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const confirmationRequest = useRef<ReturnType<typeof api.get> | null>(null);

  useEffect(() => {
    let active = true;
    if (userId && code) navigate("/confirm-email", { replace: true });
    if (!userId || !code) {
      setError(translate("O link de confirmação está incompleto ou expirou."));
      setState("error");
      return () => {
        active = false;
      };
    }

    confirmationRequest.current ??= api.get("/confirmEmail", { params: { userId, code } });
    confirmationRequest.current
      .then(() => {
        if (active) setState("success");
      }, (cause) => {
        if (active) {
          setError(handleApiError(cause).message);
          setState("error");
        }
      });
    return () => {
      active = false;
    };
  }, [userId, code, navigate]);

  return (
    <EmailFlowLayout>
      <p className="eyebrow">{translate("CONFIRMAÇÃO DE E-MAIL")}</p>
      <h2>{translate("Ative sua conta")}</h2>
      {state === "loading" && <p role="status">{translate("Confirmando seu endereço…")}</p>}
      {state === "success" && (
        <>
          <p className="success" role="status">{translate("E-mail confirmado. Você já pode entrar no TaskFlow.")}</p>
          <Link className="button" to="/login">{translate("Entrar")}</Link>
        </>
      )}
      {state === "error" && (
        <>
          <p className="error" role="alert">{localizeError(error)}</p>
          <Link className="button secondary" to="/resend-confirmation">{translate("Enviar outro link de confirmação")}</Link>
        </>
      )}
    </EmailFlowLayout>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/forgotPassword", { email });
      setSent(true);
    } catch (cause) {
      setError(handleApiError(cause).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmailFlowLayout className="email-flow-login-type">
      <p className="eyebrow">{translate("ACESSO À CONTA")}</p>
      <h2>{translate("Redefinir senha")}</h2>
      <p className="muted">{translate("Informe seu e-mail e enviaremos um link para criar uma nova senha.")}</p>
      {sent ? (
        <p className="success" role="status">{translate("Se a conta existir, enviaremos um link de redefinição.")}</p>
      ) : (
        <form className="email-flow-form" onSubmit={submit}>
          <label>{translate("E-mail")}<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {error && <p className="error" role="alert">{localizeError(error)}</p>}
          <button className="button" disabled={busy}>{busy ? translate("Aguarde…") : translate("Enviar link")}</button>
        </form>
      )}
      <EmailFlowReturnLink />
    </EmailFlowLayout>
  );
}

export function ResendConfirmation() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/resendConfirmationEmail", { email });
      setSent(true);
    } catch (cause) {
      setError(handleApiError(cause).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmailFlowLayout className="email-flow-login-type">
      <p className="eyebrow">{translate("CONFIRMAÇÃO DE E-MAIL")}</p>
      <h2>{translate("Enviar confirmação novamente")}</h2>
      <p className="muted">{translate("Informe seu e-mail e enviaremos um novo link de confirmação.")}</p>
      {sent ? (
        <p className="success" role="status">{translate("Se a conta estiver aguardando confirmação, enviaremos outro link.")}</p>
      ) : (
        <form className="email-flow-form" onSubmit={submit}>
          <label>{translate("E-mail")}<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {error && <p className="error" role="alert">{localizeError(error)}</p>}
          <button className="button" disabled={busy}>{busy ? translate("Aguarde…") : translate("Enviar link")}</button>
        </form>
      )}
      <EmailFlowReturnLink />
    </EmailFlowLayout>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [credentials] = useState(() => ({
    email: params.get("email") ?? "",
    resetCode: params.get("resetCode") ?? "",
  }));
  const { email, resetCode } = credentials;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (email && resetCode) navigate("/reset-password", { replace: true });
  }, [email, resetCode, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email || !resetCode) {
      setError(translate("O link de redefinição está incompleto ou expirou."));
      return;
    }
    if (password !== confirm) {
      setError(translate("As senhas precisam ser iguais."));
      return;
    }
    setBusy(true);
    try {
      await api.post("/resetPassword", { email, resetCode, newPassword: password });
      setComplete(true);
    } catch (cause) {
      setError(handleApiError(cause).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmailFlowLayout>
      <p className="eyebrow">{translate("ACESSO À CONTA")}</p>
      <h2>{translate("Escolha uma nova senha")}</h2>
      {complete ? (
        <>
          <p className="success" role="status">{translate("Senha atualizada. Entre com sua nova senha.")}</p>
          <Link className="button" to="/login">{translate("Entrar")}</Link>
        </>
      ) : (
        <form className="email-flow-form" onSubmit={submit}>
          <label>{translate("Nova senha")}<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>{translate("Confirmar senha")}<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
          <small className="muted">{translate("Use pelo menos 8 caracteres, com maiúsculas, minúsculas e números.")}</small>
          {error && <p className="error" role="alert">{localizeError(error)}</p>}
          <button className="button" disabled={busy}>{busy ? translate("Aguarde…") : translate("Salvar nova senha")}</button>
        </form>
      )}
      <p className="auth-switch"><Link to="/login">{translate("Voltar para entrar")}</Link></p>
    </EmailFlowLayout>
  );
}

export function AcceptInvitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryToken = params.get("token");
  const token = queryToken ?? sessionStorage.getItem(pendingInvitationKey) ?? "";
  const authenticated = Boolean(localStorage.getItem("accessToken"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accountAccessIssue, setAccountAccessIssue] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const invitationRequest = useRef<ReturnType<typeof api.post> | null>(null);

  useEffect(() => {
    if (queryToken) {
      sessionStorage.setItem(pendingInvitationKey, queryToken);
      navigate("/accept-invitation", { replace: true });
    }
  }, [queryToken, navigate]);

  useEffect(() => {
    if (!token || !authenticated || queryToken) return;
    let active = true;
    setBusy(true);
    invitationRequest.current ??= api.post("/api/invitations/accept", { token });
    invitationRequest.current
      .then(() => {
        sessionStorage.removeItem(pendingInvitationKey);
        if (active) setAccepted(true);
        if (active) setBusy(false);
      }, (cause) => {
        const apiError = handleApiError(cause);
        if (active) {
          setError(apiError.message);
          setAccountAccessIssue(apiError.status === 403);
        }
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [authenticated, queryToken, token]);

  return (
    <EmailFlowLayout>
      <p className="eyebrow">{translate("CONVITE DE EQUIPE")}</p>
      <h2>{translate("Entrar em um espaço de trabalho")}</h2>
      {!token && <p className="error" role="alert">{translate("O convite é inválido ou expirou.")}</p>}
      {token && !authenticated && (
        <>
          <p className="muted">{translate("Entre ou crie uma conta com o mesmo e-mail que recebeu o convite.")}</p>
          <div className="form-actions">
            <Link className="button" to="/login">{translate("Entrar")}</Link>
            <Link className="button secondary" to="/register">{translate("Criar conta")}</Link>
          </div>
        </>
      )}
      {busy && <p role="status">{translate("Aceitando o convite…")}</p>}
      {error && (
        <p className="error" role="alert">
          {accountAccessIssue
            ? translate("Para aceitar o convite, entre com uma conta confirmada usando o mesmo e-mail que recebeu o convite.")
            : localizeError(error)}
        </p>
      )}
      {accountAccessIssue && (
        <>
          <p className="muted">
            {translate("Confirme o e-mail e entre com a conta convidada. O convite continua salvo neste navegador.")}
          </p>
          <div className="invitation-account-actions">
            <button
              className="button"
              onClick={() => {
                localStorage.removeItem("accessToken");
                sessionStorage.removeItem("taskflow.preview");
                navigate("/login");
              }}
            >
              {translate("Sair e entrar com a conta convidada")}
            </button>
            <Link className="button secondary" to="/resend-confirmation">
              {translate("Reenviar confirmação de e-mail")}
            </Link>
          </div>
        </>
      )}
      {accepted && <p className="success" role="status">{translate("Convite aceito. Você já faz parte do espaço.")}</p>}
      {accepted && <button className="button" onClick={() => navigate("/teams")}>{translate("Abrir equipes")}</button>}
      {!authenticated && <p className="auth-switch"><Link to="/login">{translate("Voltar para entrar")}</Link></p>}
    </EmailFlowLayout>
  );
}
