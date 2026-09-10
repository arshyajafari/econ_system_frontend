export type PaymentStatus = "pending" | "confirmed" | "cancelled";

export type PaymentMethod = "cash" | "card" | "transfer" | "cheque";

export type PaymentStatusAction = "confirm" | "cancel";

export type PaymentInvoice = {
  id: string;
  code: string;
  status: string;
  total_amount: number;
};

export type PaymentCustomer = {
  id: string;
  code: string;
  name: string;
};

export type PaymentEmployee = {
  id: string;
  name: string;
};

export type Payment = {
  id: string;
  invoice: PaymentInvoice | null;
  customer: PaymentCustomer | null;
  employee: PaymentEmployee | null;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  reference_number: string | null;
  payment_date: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PaymentInvoiceOption = {
  id: string;
  code: string;
  status: string;
  total_amount: number;
};

export type PaymentListParams = {
  invoice_id?: string;
  customer_id?: string;
  employee_id?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  payment_from?: string;
  payment_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export type PaymentPaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type PaymentPaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type PaymentListResponse = {
  data: Payment[];
  links: PaymentPaginationLinks;
  meta: PaymentPaginationMeta;
};

export type PaymentFormData = {
  invoice_id: string;
  method: PaymentMethod;
  amount: string;
  reference_number: string;
  payment_date: string;
  description: string;
};

export const PAYMENT_STATUS_OPTIONS = [
  {
    value: "pending",
    label: "در انتظار تأیید",
  },
  {
    value: "confirmed",
    label: "تأیید شده",
  },
  {
    value: "cancelled",
    label: "لغو شده",
  },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  {
    value: "cash",
    label: "نقدی",
  },
  {
    value: "card",
    label: "کارت",
  },
  {
    value: "transfer",
    label: "انتقال بانکی",
  },
  {
    value: "cheque",
    label: "چک",
  },
] as const;

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return (
    PAYMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return (
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
    method
  );
}

export function canEditPayment(status: PaymentStatus): boolean {
  return status === "pending";
}
