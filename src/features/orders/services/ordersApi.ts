import { apiClient } from "../../../api/client";

import type {
  Order,
  OrderCustomerOption,
  OrderEmployeeOption,
  OrderFormData,
  OrderListParams,
  OrderListResponse,
  OrderProductOption,
  OrderStatusAction,
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
  description?: string;
  items: OrderApiItem[];
};

type CustomerListResponse = {
  data: OrderCustomerOption[];
};

type EmployeeListResponse = {
  data: OrderEmployeeOption[];
};

type ProductListResponse = {
  data: OrderProductOption[];
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

export async function performOrderStatusAction(
  id: string,
  action: OrderStatusAction,
): Promise<Order> {
  switch (action) {
    case "submit":
      return submitOrder(id);

    case "confirm":
      return confirmOrder(id);

    case "complete":
      return completeOrder(id);

    case "cancel":
      return cancelOrder(id);
  }
}

export async function getOrderCustomers(): Promise<OrderCustomerOption[]> {
  const response = await apiClient.get<CustomerListResponse>("/customers", {
    params: {
      per_page: 500,
    },
  });

  return response.data.data;
}

export async function getOrderEmployees(): Promise<OrderEmployeeOption[]> {
  const response = await apiClient.get<EmployeeListResponse>("/employees", {
    params: {
      status: "active",
      per_page: 500,
    },
  });

  return response.data.data;
}

export async function getOrderProducts(): Promise<OrderProductOption[]> {
  const response = await apiClient.get<ProductListResponse>("/products", {
    params: {
      status: "active",
      per_page: 500,
    },
  });

  return response.data.data;
}

function normalizeOrderPayload(payload: OrderFormData): OrderApiPayload {
  return {
    customer_id: payload.customer_id,
    sales_employee_id: payload.sales_employee_id,

    ...(payload.description.trim()
      ? {
          description: payload.description.trim(),
        }
      : {}),

    items: payload.items.map((item) => ({
      product_id: item.product_id,
      quantity: Math.max(1, Math.trunc(item.quantity)),
      unit_price: Number(item.unit_price),

      ...(item.description.trim()
        ? {
            description: item.description.trim(),
          }
        : {}),
    })),
  };
}
