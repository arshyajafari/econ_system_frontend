export type Expense = {
  id: string;
  title: string;
  amount: number | string;
  category: string;
  expense_date: string;
  employee: { id: string; name: string } | null;
  created_by: { id: string; name: string } | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ExpenseListParams = {
  search?: string;
  category?: string;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
  per_page?: number;
};

export type ExpenseListResponse = {
  data: Expense[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: { current_page: number; last_page: number; total: number; per_page: number };
};

export type ExpenseFormData = {
  title: string;
  amount: string;
  category: string;
  expense_date: string;
  employee_id: string;
  description: string;
};

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "administrative", label: "اداری" },
  { value: "transport", label: "حمل‌ونقل" },
  { value: "advertising", label: "تبلیغات و بازاریابی" },
  { value: "salary", label: "حقوق و مزایا" },
  { value: "rent", label: "اجاره" },
  { value: "supplies", label: "ملزومات و خرید" },
  { value: "hospitality", label: "پذیرایی" },
  { value: "other", label: "سایر" },
] as const;

export function getExpenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}
