import { apiClient } from "../../../api/client";

export type ActivityResult = "positive" | "neutral" | "negative" | "follow_up";
export type ContactType = "in_person" | "phone";
export type DailyActivityReport = {
  id: number;
  employee: { id: string | null; name: string };
  visit_date: string;
  visit_time: string | null;
  organization_name: string;
  contact_name: string | null;
  contact_type: ContactType;
  purpose: string;
  discussion: string;
  employee_question: string | null;
  audience_feedback: string | null;
  outcome: string;
  result: ActivityResult;
  is_archived: boolean;
  retention_until: string;
  created_at: string;
  updated_at: string;
};
export type DailyActivityReportInput = Omit<DailyActivityReport, "id" | "employee" | "is_archived" | "retention_until" | "created_at" | "updated_at">;
type Collection<T> = { data: T[]; meta?: { current_page: number; last_page: number; total: number } };
export type ActivityFilters = { page?: number; per_page?: number; search?: string; from?: string; to?: string; contact_type?: ContactType | ""; result?: ActivityResult | ""; employee_id?: string };
export async function getDailyActivityReports(params: ActivityFilters = {}) {
  const response = await apiClient.get<Collection<DailyActivityReport>>("/daily-activity-reports", { params });
  return response.data;
}
export async function createDailyActivityReport(payload: DailyActivityReportInput) {
  const response = await apiClient.post("/daily-activity-reports", payload);
  return response.data;
}
export async function updateDailyActivityReport(id: number, payload: DailyActivityReportInput & { edit_reason?: string }) {
  const response = await apiClient.put(`/daily-activity-reports/${id}`, payload);
  return response.data;
}
async function download(path: string, params: Record<string, unknown>, filename: string) {
  const response = await apiClient.get(path, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
export function exportDailyActivityReports(params: ActivityFilters = {}) {
  return download("/daily-activity-reports/export", params as Record<string, unknown>, "daily-activity-reports.xlsx");
}
export async function getArchivedDailyActivityReports(params: Pick<ActivityFilters, "page" | "per_page" | "search"> = {}) {
  const response = await apiClient.get<Collection<DailyActivityReport>>("/daily-activity-reports/archive", { params });
  return response.data;
}
export async function exportArchivedDailyActivityReports() {
  return download("/daily-activity-reports/export", { archive: true }, "archived-daily-activity-reports.xlsx");
}
export async function cleanupDailyActivityReports(payload: { report_ids: number[]; reason: string; confirmation: "DELETE" }) {
  const response = await apiClient.post<{ message: string; data: { deleted_count: number } }>("/daily-activity-reports/archive/cleanup", payload);
  return response.data;
}
export type ActivityCleanupRun = { id: number; deleted_count: number; reason: string; created_at: string; performed_by: string | null; report_ids: number[] };
export async function getActivityCleanupHistory() {
  const response = await apiClient.get<{ data: ActivityCleanupRun[] }>("/daily-activity-reports/archive/history");
  return response.data.data;
}
