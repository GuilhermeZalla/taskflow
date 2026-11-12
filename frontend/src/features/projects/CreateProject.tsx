import { useLanguage } from "@/i18n/react";
import { EntityForm } from "@/components/ui/EntityForm";
export function CreateProject() {
  useLanguage();
  return <EntityForm kind="projects" />;
}
