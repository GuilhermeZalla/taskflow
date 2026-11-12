import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
export function IntegrationNotice({ children }: { children: React.ReactNode }) {
  useLanguage();
  return (
    <div className="integration-notice" role="note">
      <strong>{translate("Integração pendente")}</strong>
      <p>{children}</p>
    </div>
  );
}
