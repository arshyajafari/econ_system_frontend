import { apiClient } from "../../../api/client";

import type {
  Product,
  ProductBrand,
  ProductCategory,
  ProductFormData,
  ProductListParams,
  ProductListResponse,
  ProductStatus,
} from "../types/product";

type ProductApiPayload = {
  brand_id: string;
  product_category_id: string;
  title: string;
  barcode?: string;
  sort_order: number;
  status: ProductStatus;
  image?: string;
  description?: string;
};

type ProductBrandListResponse = { data: ProductBrand[]; links: ProductPaginationLinks; meta: ProductPaginationMeta };
type ProductCategoryListResponse = { data: ProductCategory[]; links: ProductPaginationLinks; meta: ProductPaginationMeta };
type ProductPaginationMeta = { current_page: number; from: number | null; last_page: number; per_page: number; to: number | null; total: number };
type ProductPaginationLinks = { first: string | null; last: string | null; prev: string | null; next: string | null };

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/products", { params });
  return response.data;
}
export async function getProduct(id: string): Promise<Product> { const response = await apiClient.get<Product>(`/products/${id}`); return response.data; }
export async function createProduct(payload: ProductFormData): Promise<Product> { const response = await apiClient.post<Product>("/products", normalizeProductPayload(payload)); return response.data; }
export async function updateProduct(id: string, payload: ProductFormData): Promise<Product> { const response = await apiClient.put<Product>(`/products/${id}`, normalizeProductPayload(payload)); return response.data; }
export async function deleteProduct(id: string): Promise<void> { await apiClient.delete(`/products/${id}`); }
export async function changeProductStatus(id: string, status: ProductStatus): Promise<Product> { const response = await apiClient.patch<Product>(`/products/${id}/status`, { status }); return response.data; }
export async function getProductBrands(): Promise<ProductBrand[]> { const response = await apiClient.get<ProductBrandListResponse>("/brands", { params: { per_page: 100 } }); return response.data.data; }
export async function getProductCategories(): Promise<ProductCategory[]> { const response = await apiClient.get<ProductCategoryListResponse>("/product-categories", { params: { per_page: 100 } }); return response.data.data; }
function normalizeProductPayload(payload: ProductFormData): ProductApiPayload {
  return { brand_id: payload.brand_id, product_category_id: payload.product_category_id, title: payload.title.trim(), barcode: payload.barcode.trim() || undefined, sort_order: Math.max(0, payload.sort_order), status: payload.status, image: payload.image.trim() || undefined, description: payload.description.trim() || undefined };
}
