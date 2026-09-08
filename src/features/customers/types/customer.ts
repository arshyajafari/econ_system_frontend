export type CustomerStatus = "active" | "inactive" | "blocked";

export type CustomerType =
  | "pharmacy"
  | "clinic"
  | "hospital"
  | "wholesaler"
  | "store"
  | "other";

export type CustomerAddress = {
  province: string;
  city: string;
  address: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Customer = {
  id: string;
  code: string;
  customer_name: string;
  type: CustomerType;
  owner_name: string | null;
  manager_name: string | null;
  economic_code: string | null;
  national_code: string | null;
  phone_number: string;
  telephone_number: string | null;
  social_link: string | null;
  birth_date: string | null;
  status: CustomerStatus;
  description: string | null;
  meta: Record<string, unknown> | null;
  address: CustomerAddress | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type CustomerListParams = {
  search?: string;
  status?: CustomerStatus;
  type?: CustomerType;
  sort?: string;
  page?: number;
  per_page?: number;
};

export type CustomerPaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type CustomerPaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type CustomerListResponse = {
  data: Customer[];
  links: CustomerPaginationLinks;
  meta: CustomerPaginationMeta;
};

export type CustomerFormData = {
  customer_name: string;
  type: CustomerType;
  owner_name: string;
  manager_name: string;
  economic_code: string;
  national_code: string;
  phone_number: string;
  telephone_number: string;
  social_link: string;
  status: CustomerStatus;
  address: {
    province: string;
    city: string;
    address: string;
    postal_code: string;
    latitude: string;
    longitude: string;
  };
  description: string;
};
