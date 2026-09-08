import { apiClient } from "./axios";
import { normalizeApiError } from "./apiError";

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(normalizeApiError(error));
  },
);
