import { apiClient } from "../../../api/client";
import type { Doctor } from "../../doctors/types/doctor";
import type { Visit, VisitFormData, VisitListParams, VisitListResponse, VisitSample, VisitStatus } from "../types/visit";
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
