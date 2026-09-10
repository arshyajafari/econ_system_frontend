export type VisitStatus = "draft" | "completed" | "cancelled";
export type VisitDoctor = { id: string; name: string; clinic_name: string | null };
export type VisitEmployee = { id: string; name: string };
export type Visit = { id: string; doctor: VisitDoctor | null; employee: VisitEmployee | null; visit_date: string | null; purpose: string | null; description: string | null; status: VisitStatus; created_at: string | null; updated_at: string | null };
export type VisitFormData = { doctor_id: string; visit_date: string; purpose: string; description: string };
export type VisitListParams = { search?: string; doctor_id?: string; status?: VisitStatus; visit_from?: string; visit_to?: string; sort?: string; page?: number; per_page?: number };
export type VisitListResponse = { data: Visit[]; meta: { current_page: number; last_page: number; total: number; per_page: number }; links?: Record<string, string | null> };
export const VISIT_STATUS_OPTIONS: { value: VisitStatus; label: string }[] = [{ value: "draft", label: "پیش‌نویس" }, { value: "completed", label: "تکمیل‌شده" }, { value: "cancelled", label: "لغوشده" }];
export function getVisitStatusLabel(status: VisitStatus) { return VISIT_STATUS_OPTIONS.find((x) => x.value === status)?.label ?? status; }
