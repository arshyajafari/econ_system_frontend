import { apiClient } from "../../../api/client";

export type CleanupCategory = { label: string; count: number };
export type CleanupPreview = {
  retention_days: number;
  cutoff_at: string;
  categories: Record<string, CleanupCategory>;
  protected: string[];
};
export type CleanupRun = {
  id: number;
  categories: string[];
  reason: string;
  status: "running" | "completed" | "failed";
  deleted_counts: Record<string, number>;
  started_at: string;
  finished_at: string | null;
  failure_message: string | null;
  performed_by: string | null;
};
export async function getCleanupPreview() {
  const response = await apiClient.get<{ data: CleanupPreview }>("/admin/data-cleanup/preview");
  return response.data.data;
}
export async function getCleanupHistory() {
  const response = await apiClient.get<{ data: CleanupRun[] }>("/admin/data-cleanup/history");
  return response.data.data;
}
export async function executeCleanup(payload: { categories: string[]; confirmation: "DELETE" }) {
  const response = await apiClient.post<{ message: string; data: { run_id: number; deleted_counts: Record<string, number> } }>(
    "/admin/data-cleanup/execute",
    payload,
    { timeout: 120_000 },
  );
  return response.data;
}
