import { apiClient } from "../../../api/client";
import type { Doctor } from "../../doctors/types/doctor";
import type { ProductListResponse } from "../../products/types/product";
import { getScientificInventory } from "../../scientific_inventory/services/scientificInventoryApi";
import type { Visit, VisitFormData, VisitListParams, VisitListResponse, VisitSample, VisitSampleFormData, VisitSampleProduct, VisitStatus } from "../types/visit";
export async function getVisits(params: VisitListParams = {}) { const r = await apiClient.get<VisitListResponse>("/visits", { params }); return r.data; }
export async function getVisitDoctors(search = ""): Promise<Doctor[]> { const r = await apiClient.get<{ data: Doctor[] }>("/doctors", { params: { status: "active", search: search.trim() || undefined, per_page: 20 } }); return r.data.data; }
export async function createVisit(data: VisitFormData) { const r = await apiClient.post<Visit>("/visits", { doctor_id: data.doctor_id, visit_date: data.visit_date, purpose: data.purpose.trim(), description: data.description.trim() || undefined }); return r.data; }
export async function createVisitWithSample(data: VisitFormData, sample: { product_id: string; quantity: number; description: string }, clientOperationId: string) {
  const r = await apiClient.post<Visit>("/visits/with-sample", {
    doctor_id: data.doctor_id,
    visit_date: data.visit_date,
    purpose: data.purpose.trim(),
    description: data.description.trim() || undefined,
    client_operation_id: clientOperationId,
    product_id: sample.product_id,
    quantity: sample.quantity,
    sample_description: sample.description.trim() || undefined,
    sample_client_operation_id: `${clientOperationId}-sample`,
  });
  return r.data;
}
export async function updateVisit(id: string, data: Omit<VisitFormData, "doctor_id">) { const r = await apiClient.put<Visit>(`/visits/${id}`, { visit_date: data.visit_date, purpose: data.purpose.trim(), description: data.description.trim() || undefined }); return r.data; }
export async function updateVisitWithSamples(id: string, data: Omit<VisitFormData, "doctor_id">, samples: { id: string; quantity: number; description: string }[]) { const r = await apiClient.put<Visit>(`/visits/${id}/with-samples`, { visit_date: data.visit_date, purpose: data.purpose.trim(), description: data.description.trim() || undefined, samples: samples.map((sample) => ({ id: sample.id, quantity: sample.quantity, description: sample.description.trim() || undefined })) }); return r.data; }
export async function deleteVisit(id: string) { await apiClient.delete(`/visits/${id}`); }
export async function completeVisit(id: string) { const r = await apiClient.post<Visit>(`/visits/${id}/complete`); return r.data; }
export async function cancelVisit(id: string) { const r = await apiClient.post<Visit>(`/visits/${id}/cancel`); return r.data; }
export type { VisitStatus };

export async function getVisitSample(id: string): Promise<VisitSample> { const r = await apiClient.get<VisitSample>(`/samples/${id}`); return r.data; }

export async function createVisitSample(data: VisitSampleFormData): Promise<VisitSample> {
  const r = await apiClient.post<VisitSample>("/samples", {
    visit_id: data.visit_id,
    product_id: data.product_id,
    quantity: data.quantity,
    description: data.description.trim() || undefined,
  });
  return r.data;
}

export async function getVisitSampleProducts(isScientificVisitor = false): Promise<VisitSampleProduct[]> {
  if (isScientificVisitor) {
    const response = await getScientificInventory({ available_only: true, per_page: 100, sort: "-last_received_at" });
    return response.data
      .filter((item) => Boolean(item.product?.id) && item.available_quantity > 0)
      .map((item) => ({
        id: item.product!.id,
        code: item.product!.code ?? "",
        title: item.product!.title ?? "",
        available_quantity: item.available_quantity,
      }));
  }

  const response = await apiClient.get<ProductListResponse>("/products", {
    params: { status: "active", per_page: 100 },
  });
  return response.data.data.map(({ id, code, title, available_quantity }) => ({
    id,
    code,
    title,
    available_quantity,
  }));
}
