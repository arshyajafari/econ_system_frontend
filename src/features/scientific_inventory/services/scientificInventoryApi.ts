import { apiClient } from "../../../api/client";
import type { AssignScientificInventoryData, ScientificInventoryListParams, ScientificInventoryListResponse, UpdateScientificInventoryData, ScientificInventoryTransferListResponse, UpdateScientificInventoryTransferData } from "../types/scientificInventory";

export async function getScientificInventory(params: ScientificInventoryListParams = {}): Promise<ScientificInventoryListResponse> {
  const response = await apiClient.get<ScientificInventoryListResponse>("/scientific-visitor-inventory", { params });
  return response.data;
}

export async function assignScientificInventory(data: AssignScientificInventoryData) {
  const response = await apiClient.post("/scientific-visitor-inventory", {
    employee_id: data.employee_id,
    inventory_batch_id: data.inventory_batch_id,
    quantity: data.quantity,
    delivered_at: data.delivered_at,
    description: data.description.trim() || undefined,
  });
  return response.data;
}

export async function deleteScientificInventory(id: string) {
  const response = await apiClient.delete(`/scientific-visitor-inventory/${id}`);
  return response.data;
}

export async function updateScientificInventory(id: string, data: UpdateScientificInventoryData) {
  const response = await apiClient.put(`/scientific-visitor-inventory/${id}`, {
    quantity: data.quantity,
    inventory_batch_id: data.inventory_batch_id || undefined,
    description: data.description.trim() || undefined,
  });
  return response.data;
}

export async function getScientificInventoryTransfers(params: { page?: number; per_page?: number; employee_id?: string; product_id?: string } = {}): Promise<ScientificInventoryTransferListResponse> {
  const response = await apiClient.get<ScientificInventoryTransferListResponse>("/scientific-visitor-inventory/transfers", { params });
  return response.data;
}

export async function updateScientificInventoryTransfer(inventoryId: string, transferId: number, data: UpdateScientificInventoryTransferData) {
  const response = await apiClient.put(`/scientific-visitor-inventory/${inventoryId}/transfers/${transferId}`, {
    quantity: data.quantity,
    delivered_at: data.delivered_at || undefined,
    inventory_batch_id: data.inventory_batch_id || undefined,
    description: data.description?.trim() || undefined,
  });
  return response.data;
}

export async function deleteScientificInventoryTransfer(inventoryId: string, transferId: number) {
  const response = await apiClient.delete(`/scientific-visitor-inventory/${inventoryId}/transfers/${transferId}`);
  return response.data;
}
