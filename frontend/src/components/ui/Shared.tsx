import { t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  useLanguage();
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow || translate("SEU TRABALHO, EM ORDEM")}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Feedback({
  loading,
  error,
  retry,
  empty,
  children,
}: {
  loading?: boolean;
  error?: boolean;
  retry: () => unknown;
  empty?: boolean;
  children: ReactNode;
}) {
  useLanguage();
  if (loading)
    return (
      <div className="feedback" role="status">
        <span className="spinner" />
        {translate("Carregando seu trabalho…")}{" "}
      </div>
    );
  if (error)
    return (
      <div className="feedback" role="alert">
        <h2>{translate("Não foi possível carregar os dados")}</h2>
        <p>{translate("Confira a conexão e se a API está disponível.")}</p>
        <button className="button secondary" onClick={() => void retry()}>
          {translate("Tentar novamente")}{" "}
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="feedback">
        <h2>{translate("Espaço para o próximo passo")}</h2>
        <p>{translate("Crie o primeiro registro para começar a organizar seu trabalho.")}</p>
      </div>
    );
  return <>{children}</>;
}
export const action = (to: string, label: string) => (
  <Link className="button" to={to}>
    <span aria-hidden="true">+</span> {label}
  </Link>
);
export const normalized = (value: unknown) =>
  String(value ?? "")
    .replaceAll("_", "")
    .replaceAll(" ", "")
    .toLowerCase();
export function statusLabel(value: unknown) {
  const key = normalized(value);
  return (
    (
      {
        todo: translate("A fazer"),
        inprogress: translate("Em andamento"),
        review: translate("Em revisão"),
        done: translate("Concluída"),
        completed: translate("Concluída"),
        active: translate("Ativo"),
        planning: translate("Planejamento"),
        low: translate("Baixa"),
        medium: translate("Média"),
        high: translate("Alta"),
        urgent: translate("Urgente"),
      } as Record<string, string>
    )[key] || String(value)
  );
}
