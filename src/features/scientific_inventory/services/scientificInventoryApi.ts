import { apiClient } from "../../../api/client";
import type { AssignScientificInventoryData, ScientificInventoryListParams, ScientificInventoryListResponse } from "../types/scientificInventory";

export async function getScientificInventory(params: ScientificInventoryListParams = {}): Promise<ScientificInventoryListResponse> {
  const response = await apiClient.get<ScientificInventoryListResponse>("/scientific-visitor-inventory", { params: { ...params, available_only: params.available_only === undefined ? undefined : params.available_only ? 1 : 0 }, });
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