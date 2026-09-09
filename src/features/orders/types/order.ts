export type OrderStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type OrderCustomer = {
  id: string;
  code: string;
  customer_name: string;
};

export type OrderSalesEmployee = {
  id: string;
  code: string;
  name: string;
};

export type OrderProduct = {
  id: string;
  code: string;
  title: string;
};

export type OrderItem = {
  id: string;
  product: OrderProduct | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  allocations?: OrderItemAllocation[];
};

export type OrderItemAllocation = {
  id: string;
  quantity: number;
  inventory_batch_id?: string;
};

export type Order = {
  id: string;
  code: string;
  customer: OrderCustomer | null;
  sales_employee: OrderSalesEmployee | null;
  status: OrderStatus;
  ordered_at: string | null;
  description: string | null;
  meta: Record<string, unknown> | null;
  items: OrderItem[];
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type OrderCustomerOption = {
  id: string;
  code: string;
  customer_name: string;
};

export type OrderEmployeeOption = {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  status: string;
};

export type OrderProductOption = {
  id: string;
  code: string;
  title: string;
};

export type OrderListParams = {
  search?: string;
  status?: OrderStatus;
  customer_id?: string;
  sales_employee_id?: string;
  ordered_from?: string;
  ordered_to?: string;
  sort?: string;
  page?: number;
  per_page?: number;
};

export type OrderPaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type OrderPaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type OrderListResponse = {
  data: Order[];
  links: OrderPaginationLinks;
  meta: OrderPaginationMeta;
};

export type OrderItemFormData = {
  product_id: string;
  quantity: number;
  unit_price: string;
  description: string;
};

export type OrderFormData = {
  customer_id: string;
  sales_employee_id: string;
  description: string;
  items: OrderItemFormData[];
};

export type OrderStatusOption = {
  value: OrderStatus;
  label: string;
};

export const ORDER_STATUS_OPTIONS: OrderStatusOption[] = [
  {
    value: "draft",
    label: "پیش‌نویس",
  },
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
  {
    value: "completed",
    label: "تکمیل شده",
  },
];

export function getOrderStatusLabel(status: OrderStatus): string {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}
