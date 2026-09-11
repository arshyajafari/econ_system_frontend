export type InvoiceStatus = "draft" | "issued" | "cancelled";

export type InvoiceItem = {
  id: string;
  order_item_id?: string;
  product: { id: string; code: string; title: string } | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  description: string | null;
};

export type InvoicePayment = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  amount: number | string;
  method: string;
  payment_date: string | null;
  reference_number: string | null;
};

export type Invoice = {
  id: string;
  code: string;
  order: { id: string; code: string; status: string } | null;
  customer: { id: string; code: string; name: string } | null;
  employee: { id: string; name: string } | null;
  status: InvoiceStatus;
  issued_at: string | null;
  due_date: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  description: string | null;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  created_at: string | null;
  updated_at: string | null;
};

export type InvoiceListParams = {
  search?: string;
  status?: InvoiceStatus;
  customer_id?: string;
  employee_id?: string;
  issued_from?: string;
  issued_to?: string;
  page?: number;
  per_page?: number;
};

export type InvoiceListResponse = {
  data: Invoice[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: { current_page: number; last_page: number; total: number; per_page: number };
};

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return { draft: "پیش‌نویس", issued: "صادر شده", cancelled: "لغو شده" }[status];
}
