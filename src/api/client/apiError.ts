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

function firstValidationMessage(
  errors?: Record<string, string[]>,
): string | undefined {
  return Object.values(errors ?? {})
    .flat()
    .find((message) => typeof message === "string" && message.trim().length > 0);
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const validationMessage = firstValidationMessage(data?.errors);
    const isGenericValidationMessage =
      data?.message?.toLowerCase() === "the given data was invalid.";

    const message = isGenericValidationMessage
      ? validationMessage ?? data.message
      : data?.message ??
        validationMessage ??
        (status
          ? `خطا در پردازش درخواست (کد ${status}).`
          : "ارتباط با سرور برقرار نشد. اتصال شبکه را بررسی کنید.");

    return new ApiError(message, {
      status,
      errors: data?.errors,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("خطای پیش‌بینی‌نشده‌ای رخ داد.");
}
