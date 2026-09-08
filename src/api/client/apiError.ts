import axios from "axios";

export type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    options?: {
      status?: number;
      errors?: Record<string, string[]>;
    },
  ) {
    super(message);

    this.name = "ApiError";
    this.status = options?.status;
    this.errors = options?.errors;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    return new ApiError(data?.message ?? "An unexpected API error occurred.", {
      status,
      errors: data?.errors,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("An unexpected error occurred.");
}
