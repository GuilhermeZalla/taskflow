import { useLanguage } from "@/i18n/react";
import { EntityForm } from "@/components/ui/EntityForm";
export function CreateTask() {
  useLanguage();
  return <EntityForm kind="tasks" />;
}
