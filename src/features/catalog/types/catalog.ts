export type Brand = {
  id: string; code: string; title: string; logo: string | null; sort_order: number;
  is_active: boolean; description: string | null; created_at: string | null; updated_at: string | null;
};
export type ProductCategory = {
  id: string; code: string; title: string; parent_id: string | null; children?: ProductCategory[];
  sort_order: number; is_active: boolean; description: string | null; created_at: string | null; updated_at: string | null;
};
export type BrandFormData = { title: string; logo: string; sort_order: number; is_active: boolean; description: string };
export type CategoryFormData = { title: string; parent_id: string; sort_order: number; is_active: boolean; description: string };
type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number };
export type BrandListResponse = { data: Brand[]; meta: PaginationMeta };
export type CategoryListResponse = { data: ProductCategory[]; meta: PaginationMeta };
