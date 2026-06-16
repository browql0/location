import axios, { type InternalAxiosRequestConfig } from "axios";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true
});

let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;
let onTokenRefresh: ((token: string) => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler;
}

export function setTokenRefreshHandler(handler: ((token: string) => void) | null) {
  onTokenRefresh = handler;
}

export function hasAccessToken() {
  return Boolean(accessToken);
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const url = String(originalRequest?.url ?? "");

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !accessToken ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= api.post("/auth/refresh").then((response) => response.data.accessToken as string);
      const token = await refreshPromise;
      refreshPromise = null;
      setAccessToken(token);
      onTokenRefresh?.(token);
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      setAccessToken(null);
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  }
);
