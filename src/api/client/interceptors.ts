import { apiClient } from "./axios";
import { normalizeApiError } from "./apiError";
import {
  getAuthSession,
  clearAuthSession,
} from "../../features/auth/authStorage";

apiClient.interceptors.request.use((config) => {
  const session = getAuthSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }

    return Promise.reject(normalizeApiError(error));
  },
);
