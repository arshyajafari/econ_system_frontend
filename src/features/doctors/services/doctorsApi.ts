import { apiClient } from "../../../api/client";

import type {
  Doctor,
  DoctorFormData,
  DoctorListParams,
  DoctorListResponse,
  DoctorStatus,
} from "../types/doctor";

type DoctorApiPayload = Omit<DoctorFormData, "address"> & {
  address?: DoctorFormData["address"];
};

export async function getDoctors(
  params: DoctorListParams = {},
): Promise<DoctorListResponse> {
  const response = await apiClient.get<DoctorListResponse>("/doctors", {
    params,
  });

  return response.data;
}

export async function getDoctor(id: string): Promise<Doctor> {
  const response = await apiClient.get<Doctor>(`/doctors/${id}`);

  return response.data;
}

export async function createDoctor(payload: DoctorFormData): Promise<Doctor> {
  const response = await apiClient.post<Doctor>(
    "/doctors",
    normalizeDoctorPayload(payload),
  );

  return response.data;
}

export async function updateDoctor(
  id: string,
  payload: DoctorFormData,
): Promise<Doctor> {
  const response = await apiClient.put<Doctor>(
    `/doctors/${id}`,
    normalizeDoctorPayload(payload),
  );

  return response.data;
}

export async function deleteDoctor(id: string): Promise<void> {
  await apiClient.delete(`/doctors/${id}`);
}

export async function changeDoctorStatus(
  id: string,
  status: DoctorStatus,
): Promise<Doctor> {
  const response = await apiClient.patch<Doctor>(`/doctors/${id}/status`, {
    status,
  });

  return response.data;
}

export async function restoreDoctor(id: string): Promise<Doctor> {
  const response = await apiClient.patch<Doctor>(`/doctors/${id}/restore`);

  return response.data;
}

function normalizeDoctorPayload(payload: DoctorFormData): DoctorApiPayload {
  const province = payload.address.province.trim();
  const city = payload.address.city.trim();
  const address = payload.address.address.trim();
  const hasAddress = Boolean(province || city || address);

  return {
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    phone_number: payload.phone_number.trim(),
    clinic_name: payload.clinic_name.trim(),
    specialty: payload.specialty,
    status: payload.status,
    description: payload.description.trim(),
    ...(hasAddress
      ? {
          address: {
            province,
            city,
            address,
            postal_code: payload.address.postal_code.trim(),
            latitude: payload.address.latitude.trim(),
            longitude: payload.address.longitude.trim(),
          },
        }
      : {}),
  };
}
