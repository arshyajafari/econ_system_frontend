import { apiClient } from "../../../api/client";
import type { ActivityCleanupRun, ActivityFilters, DailyActivityReport, DailyActivityReportInput } from "../types/dailyActivityReport";
export type { ActivityCleanupRun, ActivityFilters, ActivityResult, ContactType, DailyActivityReport, DailyActivityReportInput } from "../types/dailyActivityReport";

type Collection<T> = { data: T[]; meta?: { current_page: number; last_page: number; total: number } };
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
export async function getManagedDailyActivityReports(params: Pick<ActivityFilters, "page" | "per_page" | "search"> = {}) {
  const response = await apiClient.get<Collection<DailyActivityReport>>("/daily-activity-reports/archive", { params });
  return response.data;
}
export async function exportManagedDailyActivityReports() {
  return download("/daily-activity-reports/export", { archive: true }, "daily-activity-reports-for-cleanup.xlsx");
}
export async function cleanupDailyActivityReports(payload: { report_ids: number[]; reason: string; confirmation: "DELETE" }) {
  const response = await apiClient.post<{ message: string; data: { deleted_count: number } }>("/daily-activity-reports/archive/cleanup", payload);
  return response.data;
}
export async function getActivityCleanupHistory() {
  const response = await apiClient.get<{ data: ActivityCleanupRun[] }>("/daily-activity-reports/archive/history");
  return response.data.data;
}
