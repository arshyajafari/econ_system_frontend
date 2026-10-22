import { apiClient } from "../../../api/client";

export type EmployeeLocation = {
  id: string;
  employee_id: string;
  employee_name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: string | null;
  captured_at: string | null;
};

export async function sendMyLocation(payload: { latitude: number; longitude: number; accuracy?: number; source?: string }): Promise<EmployeeLocation> {
  const response = await apiClient.post<EmployeeLocation>("/employees/locations/me", payload);
  return response.data;
}

export async function getEmployeeLocations(): Promise<EmployeeLocation[]> {
  const response = await apiClient.get<EmployeeLocation[]>("/employees/locations");
  return response.data;
}

export async function getEmployeeLocationHistory(employeeId: string, date: string): Promise<EmployeeLocation[]> {
  const params = new URLSearchParams({ employee_id: employeeId, date });
  const response = await apiClient.get<EmployeeLocation[]>(`/employees/locations/history?${params.toString()}`);
  return response.data;
}
