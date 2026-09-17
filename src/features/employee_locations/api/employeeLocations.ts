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

export async function getEmployeeLocations(): Promise<{ data: EmployeeLocation[] }> {
  const response = await apiClient.get<{ data: EmployeeLocation[] }>("/employees/locations");
  return response.data;
}
