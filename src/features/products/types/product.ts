export type ProductStatus = "active" | "inactive" | "discontinued" | "pending";

export type ProductBrand = {
  id: string;
  code: string;
  title: string;
  logo: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductCategory = {
  id: string;
  code: string;
  title: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  code: string;
  title: string;
  image: string | null;
  barcode: string | null;
  status: ProductStatus;
  sort_order: number;
  description: string | null;
  brand: ProductBrand | null;
  category: ProductCategory | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProductFormData = {
  brand_id: string;
  product_category_id: string;
  title: string;
  barcode: string;
  sort_order: number;
  status: ProductStatus;
  image: string;
  description: string;
};

export type ProductListParams = {
  search?: string;
  brand_id?: string;
  product_category_id?: string;
  status?: ProductStatus;
  sort?: string;
  page?: number;
  per_page?: number;
};

export type ProductPaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type ProductPaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type ProductListResponse = {
  data: Product[];
  links: ProductPaginationLinks;
  meta: ProductPaginationMeta;
};

export type ProductStatusOption = {
  value: ProductStatus;
  label: string;
};

export const PRODUCT_STATUSES: ProductStatusOption[] = [
  {
    value: "active",
    label: "فعال",
  },
  {
    value: "inactive",
    label: "غیرفعال",
  },
  {
    value: "pending",
    label: "در انتظار",
  },
  {
    value: "discontinued",
    label: "تولید متوقف شده",
  },
];
