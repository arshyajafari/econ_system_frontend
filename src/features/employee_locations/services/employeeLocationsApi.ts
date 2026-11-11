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
  description: string | null;
  started_at: string;
  start: { latitude: number; longitude: number; accuracy: number | null };
  ended_at: string | null;
  end: { latitude: number; longitude: number; accuracy: number | null } | null;
  status: "in_progress" | "completed";
  duration_seconds: number;
  admin_corrected_at: string | null;
  admin_correction_reason: string | null;
};

export async function getMyWorkSession(): Promise<EmployeeWorkSession | null> {
  const response = await apiClient.get<{ data: EmployeeWorkSession | null }>("/employees/locations/work-sessions/me");
  return response.data.data;
}

export async function startMyWorkSession(payload: {
  latitude: number; longitude: number; accuracy: number | null; client_operation_id: string; description?: string | null;
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

export async function getEmployeeWorkSessions(filters: {
  employeeId?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<{
  data: EmployeeWorkSession[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const params = new URLSearchParams();
  if (filters.employeeId) params.set('employee_id', filters.employeeId);
  params.set('page', String(filters.page ?? 1));
  params.set('per_page', String(filters.perPage ?? 25));
  const response = await apiClient.get<{
    data: EmployeeWorkSession[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }>(`/employees/locations/work-sessions?${params.toString()}`);
  return response.data;
}

export async function getEmployeeWorkSessionLocations(
  sessionId: string,
  after?: string | null
): Promise<EmployeeLocation[]> {
  const params = new URLSearchParams();
  if (after) params.set('after', after);
  const query = params.toString();
  const response = await apiClient.get<EmployeeLocation[]>(
    `/employees/locations/work-sessions/${encodeURIComponent(sessionId)}/locations${query ? `?${query}` : ''}`
  );
  return response.data;
}

export async function correctEmployeeWorkSession(sessionId: string, reason: string): Promise<EmployeeWorkSession> {
  const response = await apiClient.patch<{ data: EmployeeWorkSession }>(
    `/employees/locations/work-sessions/${encodeURIComponent(sessionId)}/correct`,
    { reason }
  );
  return response.data.data;
}

export type MyDailyLocationPointCount = {
  date: string;
  points_count: number;
};

export async function getMyDailyLocationPointCount(): Promise<MyDailyLocationPointCount> {
  const response = await apiClient.get<{ data: MyDailyLocationPointCount }>(
    "/employees/locations/me/daily-point-count"
  );
  return response.data.data;
}
