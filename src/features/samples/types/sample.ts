import type { Visit } from "../../visits/types/visit";

export type SampleProduct = {
  id: string;
  code?: string | null;
  title: string;
};

export type Sample = {
  id: string;
  visit?: Pick<Visit, "id" | "visit_date" | "status">;
  doctor?: { id: string; name: string };
  employee?: { id: string; name: string };
  product?: SampleProduct;
  quantity: number;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SampleFormData = {
  visit_id: string;
  product_id: string;
  quantity: number;
  description: string;
};

export type SampleListParams = {
  search?: string;
  visit_id?: string;
  product_id?: string;
  sort?: string;
  page?: number;
  per_page?: number;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type SampleListResponse = {
  data: Sample[];
  meta: PaginationMeta;
  links?: Record<string, string | null>;
};
