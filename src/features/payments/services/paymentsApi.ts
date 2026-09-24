import { apiClient } from "../../../api/client";
import type { Payment, PaymentFormData, PaymentListParams, PaymentListResponse, PaymentStatusAction } from "../types/payment";

type PaymentCustomerBalanceResponse = { payable_balance: number; customer: { id: string; code: string; name: string } };
type PaymentApiPayload = { method: string; amount: number; settlement_discount_amount: number; reference_number?: string; payment_date: string; description?: string };

export async function getPayments(params: PaymentListParams = {}): Promise<PaymentListResponse> {
  const response = await apiClient.get<PaymentListResponse>("/payments", { params }); return response.data;
}
export async function getPayment(id: string): Promise<Payment> {
  const response = await apiClient.get<Payment>(`/payments/${id}`); return response.data;
}
export async function getCustomerPayableBalance(customerId: string): Promise<number> {
  const response = await apiClient.get<PaymentCustomerBalanceResponse>(`/payments/customer/${customerId}/payable-balance`);
  return Number(response.data.payable_balance || 0);
}
export async function createPayment(payload: PaymentFormData): Promise<Payment> {
  const response = await apiClient.post<Payment>("/payments", toMultipart(payload), { headers: { "Content-Type": "multipart/form-data" } }); return response.data;
}
export async function updatePayment(id: string, payload: PaymentFormData): Promise<Payment> {
  if (!payload.receipt_image) {
    const response = await apiClient.put<Payment>(`/payments/${id}`, normalizePaymentPayload(payload)); return response.data;
  }
  const response = await apiClient.post<Payment>(`/payments/${id}`, toMultipart(payload, true), { headers: { "Content-Type": "multipart/form-data" } }); return response.data;
}
export async function confirmPayment(id: string): Promise<Payment> {
  const response = await apiClient.post<Payment>(`/payments/${id}/confirm`); return response.data;
}
export async function cancelPayment(id: string): Promise<Payment> {
  const response = await apiClient.post<Payment>(`/payments/${id}/cancel`); return response.data;
}
export async function performPaymentStatusAction(id: string, action: PaymentStatusAction): Promise<Payment> {
  switch (action) { case "confirm": return confirmPayment(id); case "cancel": return cancelPayment(id); }
}
function normalizePaymentPayload(payload: PaymentFormData): PaymentApiPayload {
  return {
    method: payload.method,
    amount: Number(payload.amount),
    settlement_discount_amount: Number(payload.settlement_discount_amount || 0),
    payment_date: payload.payment_date,
    ...(payload.reference_number.trim() ? { reference_number: payload.reference_number.trim() } : {}),
    ...(payload.description.trim() ? { description: payload.description.trim() } : {}),
  };
}
function toMultipart(payload: PaymentFormData, isUpdate = false): FormData {
  const form = new FormData();
  if (!isUpdate) form.append("customer_id", payload.customer_id);
  form.append("method", payload.method);
  form.append("amount", String(Number(payload.amount)));
  form.append("settlement_discount_amount", String(Number(payload.settlement_discount_amount || 0)));
  form.append("reference_number", payload.reference_number.trim());
  form.append("payment_date", payload.payment_date);
  form.append("description", payload.description.trim());
  if (isUpdate) form.append("_method", "PUT");
  if (payload.receipt_image) form.append("receipt_image", payload.receipt_image);
  return form;
}