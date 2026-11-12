/**
 * Formatador de datas ISO para exibição no Brasil (PT-BR).
 * Exemplo: 2026-11-10T15:30:00Z -> 10/11/2026 15:30
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata datas de período (início e fim) para exibição.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return "—";
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (startDate && endDate) {
    return `${startDate.toLocaleDateString("pt-BR")} — ${endDate.toLocaleDateString("pt-BR")}`;
  }
  if (startDate) return startDate.toLocaleDateString("pt-BR");
  return endDate?.toLocaleDateString("pt-BR") || "—";
}

/**
 * Mascara um email para exibição.
 * Exemplo: joaosilva@gmail.com -> joa***@gmail.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  if (localPart.length <= 3) return email;
  return `${localPart.charAt(0)}${"*".repeat(localPart.length - 3)}${localPart.charAt(localPart.length - 1)}@${domain}`;
}
