import { apiClient } from "../../../api/client";
import type { DashboardData, DashboardResponse } from "../types/dashboard";

export async function getDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardResponse>("/dashboard");
  return response.data.data;
}
