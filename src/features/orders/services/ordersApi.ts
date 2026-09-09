import { apiClient } from "../../../api/client";

import type {
  Order,
  OrderFormData,
  OrderListParams,
  OrderListResponse,
} from "../types/order";

type OrderApiItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  description?: string;
};

type OrderApiPayload = {
  customer_id: string;
  sales_employee_id: string;
  ordered_at?: string;
  description?: string;
  items: OrderApiItem[];
};

export async function getOrders(
  params: OrderListParams = {},
): Promise<OrderListResponse> {
  const response = await apiClient.get<OrderListResponse>("/orders", {
    params,
  });

  return response.data;
}

export async function getOrder(id: string): Promise<Order> {
  const response = await apiClient.get<Order>(`/orders/${id}`);

  return response.data;
}

export async function createOrder(payload: OrderFormData): Promise<Order> {
  const response = await apiClient.post<Order>(
    "/orders",
    normalizeOrderPayload(payload),
  );

  return response.data;
}

export async function updateOrder(
  id: string,
  payload: OrderFormData,
): Promise<Order> {
  const response = await apiClient.put<Order>(
    `/orders/${id}`,
    normalizeOrderPayload(payload),
  );

  return response.data;
}

export async function submitOrder(id: string): Promise<Order> {
  const response = await apiClient.post<Order>(`/orders/${id}/submit`);

  return response.data;
}

export async function confirmOrder(id: string): Promise<Order> {
  const response = await apiClient.post<Order>(`/orders/${id}/confirm`);

  return response.data;
}

export async function completeOrder(id: string): Promise<Order> {
  const response = await apiClient.post<Order>(`/orders/${id}/complete`);

  return response.data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const response = await apiClient.post<Order>(`/orders/${id}/cancel`);

  return response.data;
}

function normalizeOrderPayload(payload: OrderFormData): OrderApiPayload {
  return {
    customer_id: payload.customer_id,
    sales_employee_id: payload.sales_employee_id,

    ...(payload.ordered_at
      ? {
          ordered_at: payload.ordered_at,
        }
      : {}),

    description: payload.description.trim() || undefined,

    items: payload.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      description: item.description.trim() || undefined,
    })),
  };
}
