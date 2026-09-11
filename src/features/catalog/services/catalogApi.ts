import { apiClient } from "../../../api/client";
import type { Brand, BrandFormData, BrandListResponse, CategoryFormData, CategoryListResponse, ProductCategory } from "../types/catalog";

export async function getBrands(params: { search?: string; is_active?: boolean; page?: number; per_page?: number } = {}): Promise<BrandListResponse> {
  const response = await apiClient.get<BrandListResponse>("/brands", { params }); return response.data;
}
export async function createBrand(payload: BrandFormData): Promise<Brand> { const r = await apiClient.post<Brand>("/brands", normalizeBrand(payload)); return r.data; }
export async function updateBrand(id: string, payload: BrandFormData): Promise<Brand> { const r = await apiClient.put<Brand>(`/brands/${id}`, normalizeBrand(payload)); return r.data; }
export async function deleteBrand(id: string): Promise<void> { await apiClient.delete(`/brands/${id}`); }
export async function changeBrandActivity(id: string, is_active: boolean): Promise<Brand> { const r = await apiClient.patch<Brand>(`/brands/${id}/activity`, { is_active }); return r.data; }
export async function getCategories(params: { search?: string; is_active?: boolean; parent_id?: string; page?: number; per_page?: number } = {}): Promise<CategoryListResponse> {
  const response = await apiClient.get<CategoryListResponse>("/product-categories", { params }); return response.data;
}
export async function getCategoryTree(): Promise<ProductCategory[]> { const r = await apiClient.get<{ data: ProductCategory[] }>("/product-categories/tree"); return r.data.data; }
export async function createCategory(payload: CategoryFormData): Promise<ProductCategory> { const r = await apiClient.post<ProductCategory>("/product-categories", normalizeCategory(payload)); return r.data; }
export async function updateCategory(id: string, payload: CategoryFormData): Promise<ProductCategory> { const r = await apiClient.put<ProductCategory>(`/product-categories/${id}`, normalizeCategory(payload)); return r.data; }
export async function deleteCategory(id: string): Promise<void> { await apiClient.delete(`/product-categories/${id}`); }
export async function changeCategoryActivity(id: string, is_active: boolean): Promise<ProductCategory> { const r = await apiClient.patch<ProductCategory>(`/product-categories/${id}/activity`, { is_active }); return r.data; }
function normalizeBrand(p: BrandFormData) { return { ...p, title: p.title.trim(), logo: p.logo.trim() || undefined, description: p.description.trim() || undefined, sort_order: Math.max(0, p.sort_order) }; }
function normalizeCategory(p: CategoryFormData) { return { ...p, title: p.title.trim(), parent_id: p.parent_id || undefined, description: p.description.trim() || undefined, sort_order: Math.max(0, p.sort_order) }; }
