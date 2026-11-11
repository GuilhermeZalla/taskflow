import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export class ApiErrorClass extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiErrorClass';
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error: any): ApiErrorClass => {
  const status = error?.response?.status ?? 500;
  const message =
    error?.response?.data?.detail ??
    error?.response?.data?.title ??
    error?.message ??
    'Erro na requisição';
  return new ApiErrorClass(message, status, error?.response?.data);
};