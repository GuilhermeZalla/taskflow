import { LanguageSelector } from "@/i18n/react";
import { t as translate, localizeError } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeading, Feedback } from "@/components/ui/Shared";
import { api, handleApiError } from "@/services/api";
import { isDemo, demoStorageKey } from "@/services/demo";
export function Settings() {
  useLanguage();
  const demo = isDemo(),
    cache = useQueryClient();
  const [density, setDensity] = useState(localStorage.getItem("taskflow.density") || "comfortable"),
    [message, setMessage] = useState(""),
    [emailNotifications, setEmailNotifications] = useState(false),
    [savingEmailPreference, setSavingEmailPreference] = useState(false);
  const profile = useQuery({
    queryKey: ["profile"],
    enabled: !demo,
    retry: 1,
    queryFn: async () =>
      (await api.get<{ email?: string; fullName?: string; userId?: string; emailConfirmed?: boolean; emailNotificationsEnabled?: boolean }>("/api/auth/me")).data,
  });
  useEffect(() => {
    if (profile.data) setEmailNotifications(profile.data.emailNotificationsEnabled ?? false);
  }, [profile.data]);
  return (
    <>
      <PageHeading
        title={translate("Preferências")}
        description={translate("Ajustes do seu ambiente e informações da sessão.")}
      />
      <section className="settings-section">
        <div>
          <p className="eyebrow">{translate("Idioma")}</p>
          <h2>{translate("Idioma")}</h2>
          <p>{translate("Escolha o idioma da interface. Seus dados não serão traduzidos.")}</p>
        </div>
        <LanguageSelector />
      </section>
      {!demo && (
        <section className="settings-section">
          <div>
            <p className="eyebrow">{translate("E-MAIL")}</p>
            <h2>{translate("Notificações por e-mail")}</h2>
            <p>{translate("Receba atualizações de tarefas atribuídas, menções e prazos próximos.")}</p>
            {profile.data?.emailConfirmed === false && (
              <p className="page-note">{translate("Confirme seu endereço de e-mail para ativar notificações externas.")}</p>
            )}
          </div>
          <div className="form-actions">
            <label className="check-label">
              <input
                type="checkbox"
                checked={emailNotifications}
                disabled={!profile.data?.emailConfirmed || savingEmailPreference}
                onChange={(event) => setEmailNotifications(event.target.checked)}
              />
              {translate("Ativar notificações por e-mail")}
            </label>
            <button
              className="button secondary"
              disabled={!profile.data?.emailConfirmed || savingEmailPreference || emailNotifications === (profile.data?.emailNotificationsEnabled ?? false)}
              onClick={async () => {
                setSavingEmailPreference(true);
                setMessage("");
                try {
                  await api.put("/api/auth/email-notifications", { enabled: emailNotifications });
                  await cache.invalidateQueries({ queryKey: ["profile"] });
                  setMessage("Preferência de e-mail salva.");
                } catch (error) {
                  setMessage(localizeError(handleApiError(error).message));
                  setEmailNotifications(profile.data?.emailNotificationsEnabled ?? false);
                } finally {
                  setSavingEmailPreference(false);
                }
              }}
            >
              {savingEmailPreference ? translate("Salvando…") : translate("Salvar preferência")}
            </button>
          </div>
        </section>
      )}
      <section className="settings-section">
        <div>
          <p className="eyebrow">{translate("APRESENTAÇÃO")}</p>
          <h2>{translate("Densidade da interface")}</h2>
          <p>{translate("Controle o espaçamento das listas neste navegador.")}</p>
        </div>
        <label>
          {translate("Espaçamento")}{" "}
          <select
            value={density}
            onChange={(e) => {
              const value = e.target.value;
              setDensity(value);
              localStorage.setItem("taskflow.density", value);
              window.dispatchEvent(new Event("taskflow-settings"));
              setMessage("Preferência salva neste navegador.");
            }}
          >
            <option value="comfortable">{translate("Confortável")}</option>
            <option value="compact">{translate("Compacto")}</option>
          </select>
        </label>
      </section>
      <section className="settings-section">
        <div>
          <p className="eyebrow">{translate("SESSÃO")}</p>
          <h2>{demo ? translate("Ambiente de demonstração") : translate("Sua conta")}</h2>
          <p>
            {demo
              ? translate("Dados fictícios armazenados apenas neste navegador.")
              : translate("Informações retornadas pela API autenticada.")}
          </p>
        </div>
        {demo ? (
          <span className="badge">{translate("Demonstração ativa")}</span>
        ) : (
          <Feedback loading={profile.isLoading} error={!!profile.error} retry={profile.refetch}>
            <dl>
              <dt>{translate("E-mail")}</dt>
              <dd>{profile.data?.email || translate("Não informado")}</dd>
              {profile.data?.fullName && (
                <>
                  <dt>{translate("Nome")}</dt>
                  <dd>{profile.data.fullName}</dd>
                </>
              )}
            </dl>
          </Feedback>
        )}
      </section>
      {demo && (
        <section className="settings-section">
          <div>
            <p className="eyebrow">{translate("DADOS LOCAIS")}</p>
            <h2>{translate("Reiniciar demonstração")}</h2>
            <p>
              {translate(
                "Remove alterações, participantes e histórico locais e recupera os exemplos iniciais. Sua conta real não é afetada.",
              )}{" "}
            </p>
          </div>
          <button
            className="button secondary"
            onClick={async () => {
              if (
                !confirm(
                  translate(
                    "Reiniciar todos os dados fictícios deste navegador? As alterações da demonstração serão apagadas.",
                  ),
                )
              )
                return;
              localStorage.removeItem(demoStorageKey);
              await cache.invalidateQueries();
              setMessage("Demonstração reiniciada.");
            }}
          >
            {translate("Reiniciar dados")}{" "}
          </button>
        </section>
      )}
      {message && (
        <p className="notice" role="status">
          {translate(message)}
        </p>
      )}
      <p className="page-note">
        {translate(
          "Tema e cores seguem a identidade atual do TaskFlow. Não há cobrança, troca de senha ou alteração de permissões por esta tela.",
        )}{" "}
      </p>
    </>
  );
}
