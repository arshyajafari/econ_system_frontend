import type { Order } from "../../orders/types/order";

export type OrderReturnStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type OrderReturn = {
  id: string;
  code: string;

  order: {
    id: string;
    code: string;
    status: string;
  } | null;

  customer: {
    id: string;
    name: string;
  } | null;

  employee: {
    id: string;
    name: string;
  } | null;

  status: OrderReturnStatus;

  completed_at: string | null;

  description: string | null;

  items: OrderReturnItem[];

  created_at: string | null;
  updated_at: string | null;
};

export type OrderReturnItem = {
  id: string;

  order_item_id?: string;

  product: {
    id: string;
    title: string;
    code: string;
  } | null;

  quantity: number;

  unit_price: number;

  total_price: number;

  description: string | null;

  allocations?: OrderReturnAllocation[];
};

export type OrderReturnAllocation = {
  id: string;

  inventory_batch_id?: string;

  quantity: number;
};

export type InventoryBatch = {
  id: string;

  product: {
    id: string;
    code: string;
    title: string;
  } | null;

  batch_number: string | null;

  expire_date: string | null;

  quantity: number;

  reserved_quantity: number;

  available_quantity: number;

  is_expired: boolean;

  is_near_expire: boolean;
};

export type OrderReturnListParams = {
  search?: string;

  status?: OrderReturnStatus;

  order_id?: string;

  customer_id?: string;

  completed_from?: string;

  completed_to?: string;

  sort?: string;

  page?: number;

  per_page?: number;
};

export type OrderReturnPaginationMeta = {
  current_page: number;

  from: number | null;

  last_page: number;

  per_page: number;

  to: number | null;

  total: number;
};

export type OrderReturnPaginationLinks = {
  first: string | null;

  last: string | null;

  prev: string | null;

  next: string | null;
};

export type OrderReturnListResponse = {
  data: OrderReturn[];

  links: OrderReturnPaginationLinks;

  meta: OrderReturnPaginationMeta;
};

export type OrderReturnItemFormData = {
  order_item_id: string;

  quantity: number;

  description: string;
};

export type OrderReturnFormData = {
  order_id: string;

  description: string;

  items: OrderReturnItemFormData[];
};

export type OrderReturnAllocationInput = {
  inventory_batch_id: string;

  quantity: number;
};

export const ORDER_RETURN_STATUS_OPTIONS: Array<{
  value: OrderReturnStatus;
  label: string;
}> = [
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
    value: "completed",
    label: "تکمیل شده",
  },
  {
    value: "cancelled",
    label: "لغو شده",
  },
];

export function getOrderReturnStatusLabel(status: OrderReturnStatus): string {
  return (
    ORDER_RETURN_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? status
  );
}

export function getReturnableQuantity(
  order: Order,
  orderItemId: string,
  existingReturns: OrderReturn[] = [],
): number {
  const orderItem = order.items.find((item) => item.id === orderItemId);

  if (!orderItem) {
    return 0;
  }

  const returnedQuantity = existingReturns.reduce((sum, orderReturn) => {
    if (
      orderReturn.order?.id !== order.id ||
      orderReturn.status === "draft" ||
      orderReturn.status === "cancelled"
    ) {
      return sum;
    }

    const returnItem = orderReturn.items.find(
      (item) => item.order_item_id === orderItemId,
    );

    return sum + Number(returnItem?.quantity ?? 0);
  }, 0);

  return Math.max(0, Number(orderItem.quantity) - returnedQuantity);
}
