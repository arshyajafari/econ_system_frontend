export type OrderStatus = "draft" | "pending" | "confirmed" | "cancelled" | "completed";
export type OrderStatusAction = "submit" | "confirm" | "complete" | "cancel";
export type OrderDiscountType = "none" | "percentage" | "fixed";
export type OrderCustomer = { id: string; code: string; customer_name: string };
export type OrderSalesEmployee = { id: string; code: string; name: string };
export type OrderProductPrice = { id: string; sale_price: string; effective_from: string | null };
export type OrderProduct = { id: string; code: string; title: string; current_price: OrderProductPrice | null; sale_price?: string | null };
export type OrderItemAllocation = { id: string; quantity: number; inventory_batch_id?: string };
export type OrderItem = {
  id: string;
  product: OrderProduct | null;
  quantity: number;
  free_quantity: number;
  fulfillment_quantity: number;
  unit_price: number;
  gross_total_price?: number;
  total_price: number;
  discount_type: OrderItemDiscountType;
  discount_value: number;
  discount_amount: number;
  offer_type: OrderItemOfferType;
  offer_buy_quantity: number;
  offer_free_quantity: number;
  offer_title: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  allocations?: OrderItemAllocation[];
};
export type Order = {
  id: string;
  code: string;
  customer: OrderCustomer | null;
  sales_employee: OrderSalesEmployee | null;
  status: OrderStatus;
  ordered_at: string | null;
  description: string | null;
  discount_type: OrderDiscountType;
  discount_value: number;
  discount_amount: number;
  offer_title: string | null;
  offer_description: string | null;
  items_subtotal: number;
  final_amount: number;
  meta: Record<string, unknown> | null;
  items: OrderItem[];
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};
export type OrderCustomerOption = { id: string; code: string; customer_name: string };
export type OrderEmployeeOption = { id: string; code: string; first_name: string; last_name: string; status: string };
export type OrderProductOption = { id: string; code: string; title: string; current_price: OrderProductPrice | null; sale_price?: string | null };
export type OrderListParams = { search?: string; status?: OrderStatus; returnable?: boolean; invoiceable?: boolean; deliverable?: boolean; customer_id?: string; sales_employee_id?: string; ordered_from?: string; ordered_to?: string; sort?: string; page?: number; per_page?: number };
export type OrderPaginationMeta = { current_page: number; from: number | null; last_page: number; per_page: number; to: number | null; total: number };
export type OrderPaginationLinks = { first: string | null; last: string | null; prev: string | null; next: string | null };
export type OrderListResponse = { data: Order[]; links: OrderPaginationLinks; meta: OrderPaginationMeta };
export type OrderItemDiscountType = "none" | "percentage" | "fixed";
export type OrderItemOfferType = "none" | "buy_x_get_y";
export type OrderItemFormData = {
  product_id: string;
  quantity: number;
  unit_price: string;
  description: string;
  discount_type: OrderItemDiscountType;
  discount_value: string;
  offer_type: OrderItemOfferType;
  offer_buy_quantity: string;
  offer_free_quantity: string;
  offer_title: string;
};
export type OrderFormData = {
  customer_id: string;
  sales_employee_id: string;
  description: string;
  discount_type: OrderDiscountType;
  discount_value: string;
  offer_title: string;
  offer_description: string;
  items: OrderItemFormData[];
};
export type OrderStatusOption = { value: OrderStatus; label: string };
export const ORDER_STATUS_OPTIONS: OrderStatusOption[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "pending", label: "در انتظار تأیید" },
  { value: "confirmed", label: "تأیید شده" },
  { value: "cancelled", label: "لغو شده" },
  { value: "completed", label: "تکمیل شده" },
];
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}
export function canEditOrder(status: OrderStatus): boolean { return status === "draft"; }
