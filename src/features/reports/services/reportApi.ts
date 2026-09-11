import { apiClient } from "../../../api/client";
import type { ReportResponse } from "../types/report";

export async function getReport(from: string, to: string): Promise<ReportResponse> {
  const response = await apiClient.get<ReportResponse>("/reports/summary", { params: { from, to } });
  return response.data;
}
