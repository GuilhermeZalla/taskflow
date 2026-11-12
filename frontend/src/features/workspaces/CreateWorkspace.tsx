import { useLanguage } from "@/i18n/react";
import { EntityForm } from "@/components/ui/EntityForm";
export function CreateWorkspace() {
  useLanguage();
  return <EntityForm kind="workspaces" />;
}
