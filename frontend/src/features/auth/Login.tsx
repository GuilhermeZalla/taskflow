import { useLanguage } from "@/i18n/react";
import { AuthForm } from "./AuthForm";
export function Login() {
  useLanguage();
  return <AuthForm />;
}
