import { apiClient } from "../../../api/client";
import type { ReportData } from "../types/report";

type ReportApiResponse = ReportData | { data: ReportData };

function unwrapReport(response: ReportApiResponse): ReportData {
  const report = "data" in response && response.data && "period" in response.data
    ? response.data
    : response as ReportData;

  const payments = report.payments ?? ({} as ReportData["payments"]);
  const confirmedTotal = Number(payments.total ?? 0);
  const pendingTotal = Number(payments.pending_total ?? 0);
  const confirmedCount = Number(payments.count ?? 0);
  const pendingCount = Number(payments.pending_count ?? 0);

  return {
    ...report,
    payments: {
      ...payments,
      total: confirmedTotal,
      count: confirmedCount,
      pending_total: pendingTotal,
      pending_count: pendingCount,
      recorded_total: Number(payments.recorded_total ?? confirmedTotal + pendingTotal),
      recorded_count: Number(payments.recorded_count ?? confirmedCount + pendingCount),
    },
  };
}

export async function getReport(from: string, to: string): Promise<ReportData> {
  const response = await apiClient.get<ReportApiResponse>("/reports/summary", {
    params: { from, to },
  });

  return unwrapReport(response.data);
}
