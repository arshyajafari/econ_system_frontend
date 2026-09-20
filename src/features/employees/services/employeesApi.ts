import { apiClient } from "../../../api/client";
import type { Employee, EmployeeFormData, EmployeeListParams, EmployeeListResponse, EmployeeStatus } from "../types/employee";

export async function getEmployees(params: EmployeeListParams = {}): Promise<EmployeeListResponse> { const response = await apiClient.get<EmployeeListResponse>("/employees", { params }); return response.data; }
export async function getEmployee(id: string): Promise<Employee> { const response = await apiClient.get<Employee>(`/employees/${id}`); return response.data; }
export async function createEmployee(data: EmployeeFormData): Promise<Employee> { const response = await apiClient.post<Employee>("/employees", normalizePayload(data, false)); return response.data; }
export async function updateEmployee(id: string, data: EmployeeFormData): Promise<Employee> { const response = await apiClient.put<Employee>(`/employees/${id}`, normalizePayload(data, true)); return response.data; }
export async function deleteEmployee(id: string): Promise<void> { await apiClient.delete(`/employees/${id}`); }
export async function changeEmployeeStatus(id: string, status: EmployeeStatus): Promise<Employee> { const response = await apiClient.patch<Employee>(`/employees/${id}/status`, { status }); return response.data; }
export async function restoreEmployee(id: string): Promise<Employee> { const response = await apiClient.patch<Employee>(`/employees/${id}/restore`); return response.data; }

function normalizePayload(data: EmployeeFormData, editing: boolean) {
  const address = data.address;
  const hasAddress = Boolean(address.province.trim() || address.city.trim() || address.address.trim() || address.postal_code.trim() || address.latitude.trim() || address.longitude.trim());
  return {
    first_name: data.first_name.trim(), last_name: data.last_name.trim(), national_code: data.national_code.trim(), phone_number: data.phone_number.trim(),
    card_number: data.card_number.trim() || undefined,
    iban_number: data.iban_number.trim() || undefined,
    social_link: data.social_link.trim() || undefined, email: data.email.trim() || undefined, gender: data.gender, birth_date: data.birth_date || undefined,
    employment_type: data.employment_type, activities: data.activities, activity_type: data.activities[0], hire_date: data.hire_date, termination_date: data.termination_date || undefined, status: data.status,
    ...(editing ? {} : { login: data.login.trim(), password: data.password, password_confirmation: data.password_confirmation, roles: data.roles }),
    ...(editing && data.login.trim() ? { login: data.login.trim() } : {}),
    ...(editing && data.password ? { password: data.password, password_confirmation: data.password_confirmation } : {}),
    ...(editing && data.roles.length ? { roles: data.roles } : {}),
    ...(hasAddress ? { address: { province: address.province.trim(), city: address.city.trim(), address: address.address.trim(), postal_code: address.postal_code.trim(), latitude: address.latitude.trim(), longitude: address.longitude.trim() } } : {}),
    description: data.description.trim() || undefined,
  };
}
