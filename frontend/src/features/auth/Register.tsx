import { useLanguage } from "@/i18n/react";
import { AuthForm } from "./AuthForm";
export function Register() {
  useLanguage();
  return <AuthForm register />;
}
