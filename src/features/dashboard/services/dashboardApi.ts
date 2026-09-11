import { apiClient } from "../../../api/client";
import type { DashboardData } from "../types/dashboard";

export async function getDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>("/dashboard");
  return response.data;
}
