import { apiClient } from "../../../api/client";
import type { Expense, ExpenseFormData, ExpenseListParams, ExpenseListResponse } from "../types/expense";

export async function getExpenses(params: ExpenseListParams = {}): Promise<ExpenseListResponse> {
  const response = await apiClient.get<ExpenseListResponse>("/expenses", { params });
  return response.data;
}

export async function getExpense(id: string): Promise<Expense> {
  const response = await apiClient.get<Expense>(`/expenses/${id}`);
  return response.data;
}

export async function createExpense(payload: ExpenseFormData): Promise<Expense> {
  const response = await apiClient.post<Expense>("/expenses", normalizePayload(payload));
  return response.data;
}

export async function updateExpense(id: string, payload: ExpenseFormData): Promise<Expense> {
  const response = await apiClient.put<Expense>(`/expenses/${id}`, normalizePayload(payload));
  return response.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`/expenses/${id}`);
}

function normalizePayload(payload: ExpenseFormData) {
  return {
    title: payload.title.trim(),
    amount: Number(payload.amount),
    category: payload.category,
    expense_date: payload.expense_date,
    ...(payload.employee_id ? { employee_id: payload.employee_id } : {}),
    ...(payload.description.trim() ? { description: payload.description.trim() } : {}),
  };
}
