import { apiClient } from "../../../api/client";
import type { InventoryBatch, InventoryListResponse, ReceiveInventoryData } from "../types/inventory";

export async function getInventory(params: { search?: string; product_id?: string; expired?: boolean; sort?: string; page?: number; per_page?: number } = {}) { const response = await apiClient.get<InventoryListResponse>("/inventory-batches", { params }); return response.data; }
export async function getInventoryBatch(id: string) { const response = await apiClient.get<InventoryBatch>(`/inventory-batches/${id}`); return response.data; }
export async function updateInventoryBatch(id: string, data: Partial<Pick<ReceiveInventoryData, "batch_number" | "expire_date" | "description">>) { const response = await apiClient.put<InventoryBatch>(`/inventory-batches/${id}`, data); return response.data; }

export async function receiveInventory(data: ReceiveInventoryData) { const response = await apiClient.post("/inventory-batches", { product_id: data.product_id, batch_number: data.batch_number || undefined, expire_date: data.expire_date || undefined, quantity: data.quantity, purchase_price: data.purchase_price, received_at: data.received_at || undefined, description: data.description.trim() || undefined }); return response.data; }
export async function deleteInventoryBatch(id: string) { await apiClient.delete(`/inventory-batches/${id}`); }
