import { apiClient } from "../../../api/client";

import type {
  InventoryBatch,
  OrderReturn,
  OrderReturnAllocationInput,
  OrderReturnFormData,
  OrderReturnListParams,
  OrderReturnListResponse,
} from "../types/orderReturn";

type InventoryBatchListResponse = {
  data: InventoryBatch[];

  meta?: unknown;

  links?: unknown;
};

export async function getOrderReturns(
  params: OrderReturnListParams = {},
): Promise<OrderReturnListResponse> {
  const response = await apiClient.get<OrderReturnListResponse>(
    "/order-returns",
    {
      params,
    },
  );

  return response.data;
}

export async function getOrderReturn(id: string): Promise<OrderReturn> {
  const response = await apiClient.get<OrderReturn>(`/order-returns/${id}`);

  return response.data;
}

export async function createOrderReturn(
  payload: OrderReturnFormData,
): Promise<OrderReturn> {
  const response = await apiClient.post<OrderReturn>(
    "/order-returns",
    normalizePayload(payload),
  );

  return response.data;
}

export async function updateOrderReturn(
  id: string,
  payload: OrderReturnFormData,
): Promise<OrderReturn> {
  const response = await apiClient.put<OrderReturn>(
    `/order-returns/${id}`,
    normalizePayload(payload),
  );

  return response.data;
}

export async function submitOrderReturn(id: string): Promise<OrderReturn> {
  const response = await apiClient.post<OrderReturn>(
    `/order-returns/${id}/submit`,
  );

  return response.data;
}

export async function confirmOrderReturn(id: string): Promise<OrderReturn> {
  const response = await apiClient.post<OrderReturn>(
    `/order-returns/${id}/confirm`,
  );

  return response.data;
}

export async function completeOrderReturn(id: string): Promise<OrderReturn> {
  const response = await apiClient.post<OrderReturn>(
    `/order-returns/${id}/complete`,
  );

  return response.data;
}

export async function cancelOrderReturn(id: string): Promise<OrderReturn> {
  const response = await apiClient.post<OrderReturn>(
    `/order-returns/${id}/cancel`,
  );

  return response.data;
}

export async function allocateOrderReturnItem(
  itemId: string,
  allocations: OrderReturnAllocationInput[],
): Promise<OrderReturn> {
  const response = await apiClient.post<OrderReturn>(
    `/order-return-items/${itemId}/allocate`,
    {
      allocations,
    },
  );

  return response.data;
}

export async function getInventoryBatches(
  productId: string,
): Promise<InventoryBatch[]> {
  const response = await apiClient.get<InventoryBatchListResponse>(
    "/inventory-batches",
    {
      params: {
        product_id: productId,
        expired: false,
        per_page: 100,
        sort: "expire_date",
      },
    },
  );

  return response.data.data;
}

function normalizePayload(payload: OrderReturnFormData): OrderReturnFormData {
  return {
    order_id: payload.order_id,

    description: payload.description.trim(),

    items: payload.items.map((item) => ({
      order_item_id: item.order_item_id,

      quantity: Math.max(1, Math.trunc(Number(item.quantity))),

      description: item.description.trim(),
    })),
  };
}
