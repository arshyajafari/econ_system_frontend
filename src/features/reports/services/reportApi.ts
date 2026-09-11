import { apiClient } from "../../../api/client";
import type { ReportData } from "../types/report";

export async function getReport(from: string, to: string): Promise<ReportData> {
  const response = await apiClient.get<{ data: ReportData }>("/reports/summary", {
    params: { from, to },
  });

  return response.data.data;
}
