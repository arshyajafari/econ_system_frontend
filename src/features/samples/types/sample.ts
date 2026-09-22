export type SampleProduct = { id: string; code?: string | null; title: string; available_quantity?: number };
export type SampleVisit = { id: string; visit_date: string | null; status: "draft" | "completed" | "cancelled" };
export type Sample = { id: string; visit?: SampleVisit; doctor?: { id: string; name: string } | null; doctor_name?: string | null; employee?: { id: string; name: string } | null; product?: SampleProduct | null; product_name?: string | null; quantity: number; description?: string | null; created_at?: string | null; updated_at?: string | null };
export type SampleFormData = { visit_id: string; product_id: string; quantity: number; description: string };
export type SampleListParams = { search?: string; visit_id?: string; product_id?: string; sort?: string; page?: number; per_page?: number };
type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number };
export type SampleListResponse = { data: Sample[]; meta: PaginationMeta; links?: Record<string, string | null> };