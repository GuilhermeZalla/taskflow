import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token no cabeçalho
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para lidar com erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401;
    if (is401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export class ApiErrorClass extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiErrorClass';
  }
}

export const handleApiError = (error: unknown): ApiErrorClass => {
  if (error && typeof error === 'object' && 'response' in error && error.response?.status) {
    const axiosError = error as any;
    if (axiosError.response?.data) {
      return axiosError.response.data as ApiErrorClass;
    }
    return new ApiErrorClass(
      axiosError.message || 'Erro na requisição',
      axiosError.response?.status || 500,
      axiosError.response?.data as any,
    );
  }
  return new ApiErrorClass(
    'Erro inesperado',
    500,
    error as any,
  );
};