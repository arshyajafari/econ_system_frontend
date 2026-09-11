import { apiClient } from "../../../api/client";
import type { Invoice, InvoiceListParams, InvoiceListResponse } from "../types/invoice";

type ApiInvoiceList = InvoiceListResponse;

export async function getInvoices(params: InvoiceListParams = {}): Promise<ApiInvoiceList> {
  const response = await apiClient.get<ApiInvoiceList>("/invoices", { params });
  return response.data;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const response = await apiClient.get<Invoice>(`/invoices/${id}`);
  return response.data;
}

export async function createInvoiceFromOrder(orderId: string): Promise<Invoice> {
  const response = await apiClient.post<Invoice>(`/invoices/orders/${orderId}/invoice`);
  return response.data;
}

export async function updateInvoice(id: string, payload: { due_date?: string | null; discount_amount?: number; tax_amount?: number; description?: string | null }): Promise<Invoice> {
  const response = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
  return response.data;
}

export async function issueInvoice(id: string): Promise<Invoice> {
  const response = await apiClient.post<Invoice>(`/invoices/${id}/issue`);
  return response.data;
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const response = await apiClient.post<Invoice>(`/invoices/${id}/cancel`);
  return response.data;
}
