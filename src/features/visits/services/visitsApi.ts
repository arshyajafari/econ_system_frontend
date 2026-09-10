import { apiClient } from "../../../api/client";
import type { Doctor } from "../../doctors/types/doctor";
import type { Visit, VisitFormData, VisitListParams, VisitListResponse, VisitStatus } from "../types/visit";
export async function getVisits(params: VisitListParams = {}) { const r = await apiClient.get<VisitListResponse>("/visits", { params }); return r.data; }
export async function getVisitDoctors(): Promise<Doctor[]> { const r = await apiClient.get<{ data: Doctor[] }>("/doctors", { params: { status: "active", per_page: 500 } }); return r.data.data; }
export async function createVisit(data: VisitFormData) { const r = await apiClient.post<Visit>("/visits", { doctor_id: data.doctor_id, visit_date: data.visit_date, purpose: data.purpose.trim(), description: data.description.trim() || undefined }); return r.data; }
export async function updateVisit(id: string, data: Omit<VisitFormData, "doctor_id">) { const r = await apiClient.put<Visit>(`/visits/${id}`, { visit_date: data.visit_date, purpose: data.purpose.trim(), description: data.description.trim() || undefined }); return r.data; }
export async function completeVisit(id: string) { const r = await apiClient.post<Visit>(`/visits/${id}/complete`); return r.data; }
export async function cancelVisit(id: string) { const r = await apiClient.post<Visit>(`/visits/${id}/cancel`); return r.data; }
export type { VisitStatus };
