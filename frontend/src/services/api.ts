import { getLanguage } from "@/i18n/core";
import { isDemo, demoAdapter } from "./demo";
import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:5080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: any) => {
  if (isDemo() && config.url?.startsWith("/api/")) config.adapter = demoAdapter;
  config.headers = config.headers ?? {};
  config.headers["Accept-Language"] = getLanguage();
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (
      error?.response?.status === 401 &&
      localStorage.getItem("accessToken") &&
      !["/login", "/register"].includes(window.location.pathname)
    ) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export class ApiErrorClass extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiErrorClass";
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error: any): ApiErrorClass => {
  const status = error?.response?.status ?? 500;
  const data = error?.response?.data;
  const validationErrors = data?.errors ?? {};
  const validationEntries = Object.entries(validationErrors);
  const identityErrorMessages: Record<string, string> = {
    duplicateemail: "Este e-mail já está cadastrado. Entre na conta ou use as opções de recuperação.",
    duplicateusername: "Este e-mail já está cadastrado. Entre na conta ou use as opções de recuperação.",
    invalidemail: "Informe um endereço de e-mail válido.",
    passwordtooshort: "A senha não atende ao tamanho mínimo exigido.",
    passwordrequiresdigit: "A senha precisa conter pelo menos um número.",
    passwordrequireslower: "A senha precisa conter pelo menos uma letra minúscula.",
    passwordrequiresupper: "A senha precisa conter pelo menos uma letra maiúscula.",
  };
  const identityMessage = validationEntries
    .map(([code]) => identityErrorMessages[code.toLowerCase()])
    .find(Boolean);
  const firstValidationMessage = validationEntries
    .flatMap(([, messages]) => Array.isArray(messages) ? messages : [messages])
    .find((message) => typeof message === "string" && message.trim());
  const validationMessage = identityMessage ?? firstValidationMessage;
  const message =
    validationMessage ??
    data?.detail ??
    data?.title ??
    error?.message ??
    "Erro na requisição";
  return new ApiErrorClass(message, status, data);
};
