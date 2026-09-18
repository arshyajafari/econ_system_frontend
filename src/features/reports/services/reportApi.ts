import { apiClient } from "../../../api/client";
import type { ReportData, ReportResponse } from "../types/report";

export async function getReport(from: string, to: string): Promise<ReportData> {
  const response = await apiClient.get<ReportResponse>("/reports/summary", {
    params: { from, to },
  });

  return response.data.data;
}
