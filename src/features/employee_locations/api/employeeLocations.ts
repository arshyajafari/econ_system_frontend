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

export async function sendMyLocation(payload: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
  captured_at?: string;
  client_operation_id?: string;
}): Promise<EmployeeLocation> {
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

export type EmployeeLocationDailySummary = {
  date: string;
  points_count: number;
  distance_meters: number;
  stop_duration_seconds: number;
  stops_count: number;
  gaps_count: number;
};

export async function getEmployeeLocationDailySummary(employeeId: string): Promise<EmployeeLocationDailySummary[]> {
  const params = new URLSearchParams({ employee_id: employeeId });
  const response = await apiClient.get<EmployeeLocationDailySummary[]>(`/employees/locations/history/daily-summary?${params.toString()}`);
  return response.data;
}


export async function getEmployeeLocationLive(
  employeeId: string,
  after?: string | null
): Promise<EmployeeLocation[]> {
  const params = new URLSearchParams({ employee_id: employeeId });
  if (after) params.set('after', after);
  const response = await apiClient.get<EmployeeLocation[]>(`/employees/locations/live?${params.toString()}`);
  return response.data;
}


export type EmployeeWorkSession = {
  id: string;
  employee_id: string;
  employee_name: string;
  work_date: string;
  started_at: string;
  start: { latitude: number; longitude: number; accuracy: number | null };
  ended_at: string | null;
  end: { latitude: number; longitude: number; accuracy: number | null } | null;
  status: "in_progress" | "completed";
};

export async function getMyWorkSession(): Promise<EmployeeWorkSession | null> {
  const response = await apiClient.get<{ data: EmployeeWorkSession | null }>("/employees/locations/work-sessions/me");
  return response.data.data;
}

export async function startMyWorkSession(payload: {
  latitude: number; longitude: number; accuracy: number | null; client_operation_id: string;
}): Promise<EmployeeWorkSession> {
  const response = await apiClient.post<{ data: EmployeeWorkSession }>("/employees/locations/work-sessions/start", payload);
  return response.data.data;
}

export async function endMyWorkSession(payload: {
  latitude: number; longitude: number; accuracy: number | null; client_operation_id: string;
}): Promise<EmployeeWorkSession> {
  const response = await apiClient.post<{ data: EmployeeWorkSession }>("/employees/locations/work-sessions/end", payload);
  return response.data.data;
}

export async function getEmployeeWorkSessions(date?: string): Promise<EmployeeWorkSession[]> {
  const params = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await apiClient.get<{ data: EmployeeWorkSession[] }>(`/employees/locations/work-sessions${params}`);
  return response.data.data;
}
