import { apiClient } from "../../../api/client";
import type { AssignScientificInventoryData, ScientificInventoryListParams, ScientificInventoryListResponse, UpdateScientificInventoryData } from "../types/scientificInventory";

export async function getScientificInventory(params: ScientificInventoryListParams = {}): Promise<ScientificInventoryListResponse> {
  const response = await apiClient.get<ScientificInventoryListResponse>("/scientific-visitor-inventory", { params });
  return response.data;
}

export async function assignScientificInventory(data: AssignScientificInventoryData) {
  const response = await apiClient.post("/scientific-visitor-inventory", {
    employee_id: data.employee_id,
    inventory_batch_id: data.inventory_batch_id,
    quantity: data.quantity,
    description: data.description.trim() || undefined,
  });
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
