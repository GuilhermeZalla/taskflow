import { getLocale, t as translate } from "@/i18n/core";
import { useLanguage } from "@/i18n/react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type { UserNotification } from "@/services/demo";

export function NotificationCenter() {
  useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<UserNotification[]>("/api/notifications")).data,
    refetchInterval: 60_000,
  });
  const unread = query.data?.filter((notification) => !notification.isRead).length ?? 0;

  async function markRead(notification: UserNotification) {
    if (!notification.isRead) {
      await api.put("/api/notifications/" + notification.id + "/read");
      await cache.invalidateQueries({ queryKey: ["notifications"] });
    }
    setOpen(false);
    navigate(notification.taskId ? "/tasks/" + notification.taskId + "/edit" : "/activity");
  }

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-toggle quiet"
        aria-label={translate("Notificações") + (unread ? ` (${unread})` : "")}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen(!open)}
      >
        {translate("Notificações")}
        {unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <section id="notification-panel" className="notification-panel" aria-label={translate("Notificações")}>
          <div className="notification-panel-heading">
            <h2>{translate("Notificações")}</h2>
            {unread > 0 && (
              <button
                type="button"
                className="quiet"
                onClick={async () => {
                  await api.put("/api/notifications/read-all");
                  await cache.invalidateQueries({ queryKey: ["notifications"] });
                }}
              >
                {translate("Marcar todas como lidas")}
              </button>
            )}
          </div>
          {query.isLoading ? (
            <p role="status">{translate("Carregando seu trabalho…")}</p>
          ) : query.error ? (
            <p role="alert">{translate("Não foi possível carregar as notificações.")}</p>
          ) : query.data?.length ? (
            <ul>
              {query.data.slice(0, 10).map((notification) => (
                <li key={notification.id} className={notification.isRead ? "read" : "unread"}>
                  <button type="button" onClick={() => void markRead(notification)}>
                    <strong>{translate(notification.title)}</strong>
                    <span>{notification.message}</span>
                    <time dateTime={notification.createdAt}>
                      {new Intl.DateTimeFormat(getLocale(), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(notification.createdAt))}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notification-empty">{translate("Você está em dia.")}</p>
          )}
        </section>
      )}
    </div>
  );
}
