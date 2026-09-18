import { apiClient } from "../../../api/client";
import type { ReportData } from "../types/report";

type ReportApiResponse = ReportData | { data: ReportData };

function unwrapReport(response: ReportApiResponse): ReportData {
  if ("data" in response && response.data && "period" in response.data) {
    return response.data;
  }
  return response as ReportData;
}

export async function getReport(from: string, to: string): Promise<ReportData> {
  const response = await apiClient.get<ReportApiResponse>("/reports/summary", {
    params: { from, to },
  });

  return unwrapReport(response.data);
}
