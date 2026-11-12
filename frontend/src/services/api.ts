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
  const message =
    error?.response?.data?.detail ??
    error?.response?.data?.title ??
    Object.values(error?.response?.data?.errors ?? {}).flat().find(Boolean) ??
    error?.message ??
    "Erro na requisição";
  return new ApiErrorClass(message, status, error?.response?.data);
};
