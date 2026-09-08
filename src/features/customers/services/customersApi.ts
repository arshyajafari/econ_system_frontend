import { apiClient } from "../../../api/client";

import type {
  Customer,
  CustomerFormData,
  CustomerListParams,
  CustomerListResponse,
  CustomerStatus,
} from "../types/customer";

type CustomerApiPayload = Omit<CustomerFormData, "address"> & {
  address?: CustomerFormData["address"];
};

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<CustomerListResponse> {
  const response = await apiClient.get<CustomerListResponse>("/customers", {
    params,
  });

  return response.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const response = await apiClient.get<Customer>(`/customers/${id}`);

  return response.data;
}

export async function createCustomer(
  payload: CustomerFormData,
): Promise<Customer> {
  const response = await apiClient.post<Customer>(
    "/customers",
    normalizeCustomerPayload(payload),
  );

  return response.data;
}

export async function updateCustomer(
  id: string,
  payload: CustomerFormData,
): Promise<Customer> {
  const response = await apiClient.put<Customer>(
    `/customers/${id}`,
    normalizeCustomerPayload(payload),
  );

  return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

export async function changeCustomerStatus(
  id: string,
  status: CustomerStatus,
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(`/customers/${id}/status`, {
    status,
  });

  return response.data;
}

export async function restoreCustomer(id: string): Promise<Customer> {
  const response = await apiClient.patch<Customer>(`/customers/${id}/restore`);

  return response.data;
}

function normalizeCustomerPayload(
  payload: CustomerFormData,
): CustomerApiPayload {
  const province = payload.address.province.trim();
  const city = payload.address.city.trim();
  const address = payload.address.address.trim();

  const hasAddress = Boolean(province || city || address);

  return {
    customer_name: payload.customer_name.trim(),
    type: payload.type,
    owner_name: payload.owner_name.trim(),
    manager_name: payload.manager_name.trim(),
    economic_code: payload.economic_code.trim(),
    national_code: payload.national_code.trim(),
    phone_number: payload.phone_number.trim(),
    telephone_number: payload.telephone_number.trim(),
    social_link: payload.social_link.trim(),
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
