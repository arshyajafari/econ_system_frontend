import { apiClient } from "../../../api/client";

import type {
  Payment,
  PaymentFormData,
  PaymentInvoiceOption,
  PaymentListParams,
  PaymentListResponse,
  PaymentStatusAction,
} from "../types/payment";

type InvoiceListResponse = {
  data: PaymentInvoiceOption[];
};

type PaymentApiPayload = {
  invoice_id: string;
  method: string;
  amount: number;
  reference_number?: string;
  payment_date: string;
  description?: string;
};

export async function getPayments(
  params: PaymentListParams = {},
): Promise<PaymentListResponse> {
  const response = await apiClient.get<PaymentListResponse>("/payments", {
    params,
  });

  return response.data;
}

export async function getPayment(id: string): Promise<Payment> {
  const response = await apiClient.get<Payment>(`/payments/${id}`);

  return response.data;
}

export async function createPayment(
  payload: PaymentFormData,
): Promise<Payment> {
  const response = await apiClient.post<Payment>(
    "/payments",
    normalizePaymentPayload(payload),
  );

  return response.data;
}

export async function updatePayment(
  id: string,
  payload: PaymentFormData,
): Promise<Payment> {
  const response = await apiClient.put<Payment>(
    `/payments/${id}`,
    normalizePaymentPayload(payload, true),
  );

  return response.data;
}

export async function confirmPayment(id: string): Promise<Payment> {
  const response = await apiClient.post<Payment>(`/payments/${id}/confirm`);

  return response.data;
}

export async function cancelPayment(id: string): Promise<Payment> {
  const response = await apiClient.post<Payment>(`/payments/${id}/cancel`);

  return response.data;
}

export async function performPaymentStatusAction(
  id: string,
  action: PaymentStatusAction,
): Promise<Payment> {
  switch (action) {
    case "confirm":
      return confirmPayment(id);

    case "cancel":
      return cancelPayment(id);
  }
}

export async function getPaymentInvoices(): Promise<PaymentInvoiceOption[]> {
  const response = await apiClient.get<InvoiceListResponse>("/invoices", {
    params: {
      status: "issued",
      per_page: 500,
    },
  });

  return response.data.data;
}

function normalizePaymentPayload(
  payload: PaymentFormData,
  isUpdate = false,
): PaymentApiPayload {
  const normalized: PaymentApiPayload = {
    invoice_id: payload.invoice_id,
    method: payload.method,
    amount: Number(payload.amount),
    payment_date: payload.payment_date,
  };

  if (!isUpdate || payload.reference_number.trim()) {
    normalized.reference_number = payload.reference_number.trim();
  }

  if (!isUpdate || payload.description.trim()) {
    normalized.description = payload.description.trim();
  }

  return normalized;
}
