import { apiClient } from "../../../api/client";
import type { Brand, BrandFormData, BrandListResponse, CategoryFormData, CategoryListResponse, ProductCategory } from "../types/catalog";

export async function getBrands(params: { search?: string; is_active?: boolean; page?: number; per_page?: number } = {}): Promise<BrandListResponse> { const response = await apiClient.get<BrandListResponse>("/brands", { params }); return response.data; }
export async function createBrand(payload: BrandFormData): Promise<Brand> { const r = await apiClient.post<Brand>("/brands", normalizeBrand(payload)); return payload.logo_file ? uploadBrandLogo(r.data.id, payload.logo_file) : r.data; }
export async function updateBrand(id: string, payload: BrandFormData): Promise<Brand> { const r = await apiClient.put<Brand>(`/brands/${id}`, normalizeBrand(payload)); return payload.logo_file ? uploadBrandLogo(id, payload.logo_file) : r.data; }
export async function uploadBrandLogo(id: string, file: File): Promise<Brand> { const form = new FormData(); form.append("logo", file); const r = await apiClient.post<Brand>(`/brands/${id}/logo`, form, { headers: { "Content-Type": "multipart/form-data" } }); return r.data; }
export async function deleteBrand(id: string): Promise<void> { await apiClient.delete(`/brands/${id}`); }
export async function changeBrandActivity(id: string, is_active: boolean): Promise<Brand> { const r = await apiClient.patch<Brand>(`/brands/${id}/activity`, { is_active }); return r.data; }
export async function getCategories(params: { search?: string; is_active?: boolean; parent_id?: string; page?: number; per_page?: number } = {}): Promise<CategoryListResponse> { const response = await apiClient.get<CategoryListResponse>("/product-categories", { params }); return response.data; }
export async function getCategoryTree(): Promise<ProductCategory[]> { const r = await apiClient.get<ProductCategory[] | { data?: ProductCategory[] }>("/product-categories/tree"); const payload = r.data; return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []; }
export async function createCategory(payload: CategoryFormData): Promise<ProductCategory> { const r = await apiClient.post<ProductCategory>("/product-categories", normalizeCategory(payload)); return r.data; }
export async function updateCategory(id: string, payload: CategoryFormData): Promise<ProductCategory> { const r = await apiClient.put<ProductCategory>(`/product-categories/${id}`, normalizeCategory(payload)); return r.data; }
export async function deleteCategory(id: string): Promise<void> { await apiClient.delete(`/product-categories/${id}`); }
export async function changeCategoryActivity(id: string, is_active: boolean): Promise<ProductCategory> { const r = await apiClient.patch<ProductCategory>(`/product-categories/${id}/activity`, { is_active }); return r.data; }
function normalizeBrand(p: BrandFormData) { return { title: p.title.trim(), logo: p.logo.trim() || undefined, sort_order: Math.max(0, p.sort_order), is_active: p.is_active, description: p.description.trim() || undefined }; }
function normalizeCategory(p: CategoryFormData) { return { ...p, title: p.title.trim(), parent_id: p.parent_id || undefined, description: p.description.trim() || undefined, sort_order: Math.max(0, p.sort_order) }; }
