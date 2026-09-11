import { apiClient } from "../../../api/client";
import type { Employee, EmployeeFormData, EmployeeListParams, EmployeeListResponse, EmployeeStatus } from "../types/employee";

export async function getEmployees(params: EmployeeListParams = {}): Promise<EmployeeListResponse> {
  const response = await apiClient.get<EmployeeListResponse>("/employees", { params });
  return response.data;
}
export async function getEmployee(id: string): Promise<Employee> {
  const response = await apiClient.get<Employee>(`/employees/${id}`);
  return response.data;
}
export async function createEmployee(data: EmployeeFormData): Promise<Employee> {
  const response = await apiClient.post<Employee>("/employees", normalizePayload(data));
  return response.data;
}
export async function updateEmployee(id: string, data: EmployeeFormData): Promise<Employee> {
  const response = await apiClient.put<Employee>(`/employees/${id}`, normalizePayload(data));
  return response.data;
}
export async function deleteEmployee(id: string): Promise<void> { await apiClient.delete(`/employees/${id}`); }
export async function changeEmployeeStatus(id: string, status: EmployeeStatus): Promise<Employee> {
  const response = await apiClient.patch<Employee>(`/employees/${id}/status`, { status });
  return response.data;
}
export async function restoreEmployee(id: string): Promise<Employee> {
  const response = await apiClient.patch<Employee>(`/employees/${id}/restore`);
  return response.data;
}
function normalizePayload(data: EmployeeFormData) {
  const address = data.address;
  const hasAddress = Boolean(address.province.trim() || address.city.trim() || address.address.trim() || address.postal_code.trim());
  return {
    first_name: data.first_name.trim(), last_name: data.last_name.trim(), national_code: data.national_code.trim(), phone_number: data.phone_number.trim(),
    social_link: data.social_link.trim() || undefined, email: data.email.trim() || undefined, gender: data.gender, birth_date: data.birth_date || undefined,
    employment_type: data.employment_type, hire_date: data.hire_date, termination_date: data.termination_date || undefined, status: data.status,
    ...(hasAddress ? { address: { province: address.province.trim(), city: address.city.trim(), address: address.address.trim(), postal_code: address.postal_code.trim(), latitude: address.latitude.trim(), longitude: address.longitude.trim() } } : {}),
    description: data.description.trim() || undefined,
  };
}
