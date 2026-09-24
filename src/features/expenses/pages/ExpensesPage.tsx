import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError } from "../../../api/client";
import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { getEmployees } from "../../employees/services/employeesApi";
import type { Employee } from "../../employees/types/employee";
import { useAuth } from "../../auth";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../services/expensesApi";
import {
  EXPENSE_CATEGORY_OPTIONS,
  getExpenseCategoryLabel,
} from "../types/expense";
import type { Expense, ExpenseFormData } from "../types/expense";

const numberFormatter = new Intl.NumberFormat("fa-IR");
const dateFormatter = new Intl.DateTimeFormat("fa-IR");

function today(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function emptyForm(): ExpenseFormData {
  return {
    title: "",
    amount: "",
    category: "administrative",
    expense_date: today(),
    employee_id: "",
    description: "",
  };
}

export function ExpensesPage() {
  const { user } = useAuth();
  const isManager = user?.roles.some((role) => role === "admin" || role === "accountant") ?? false;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExpenses({
        search: search.trim() || undefined,
        category: category || undefined,
        employee_id: employeeId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 20,
      });
      setExpenses(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError && requestError.message
          ? requestError.message
          : "خطا در دریافت هزینه‌ها.",
      );
    } finally {
      setLoading(false);
    }
  }, [category, dateFrom, dateTo, employeeId, page, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), search.trim() ? 300 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, search]);

  useEffect(() => {
    let cancelled = false;
    async function loadEmployees() {
      try {
        const response = await getEmployees({ status: "active", per_page: 100 });
        if (!cancelled) setEmployees(response.data);
      } catch {
        // Payer filtering is optional; the expense list remains usable.
      }
    }
    void loadEmployees();
    return () => {
      cancelled = true;
    };
  }, []);

  const pageTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses],
  );

  function openCreate() {
    setEditingExpense(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      expense_date: expense.expense_date,
      employee_id: expense.employee?.id ?? "",
      description: expense.description ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingExpense(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.category || !form.expense_date) {
      setFormError("عنوان، مبلغ، دسته‌بندی و تاریخ هزینه الزامی هستند.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, form);
      } else {
        await createExpense(form);
      }
      setFormOpen(false);
      setEditingExpense(null);
      setFormError(null);
      await load();
    } catch (requestError: unknown) {
      setFormError(
        requestError instanceof ApiError && requestError.message
          ? requestError.message
          : "خطا در ذخیره هزینه.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: Expense) {
    if (deletingId) return;
    if (!window.confirm(`آیا از حذف هزینه «${expense.title}» مطمئن هستید؟`)) return;

    setDeletingId(expense.id);
    setError(null);
    try {
      await deleteExpense(expense.id);
      await load();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError && requestError.message
          ? requestError.message
          : "حذف هزینه انجام نشد.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetFilters() {
    setSearch("");
    setCategory("");
    setEmployeeId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">هزینه‌ها</h1>
          <p className="mt-1 text-sm text-gray-500">
            ثبت و مدیریت هزینه‌های جاری شرکت
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            بروزرسانی
          </button>
          {isManager ? (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              ثبت هزینه
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {formOpen ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingExpense ? "ویرایش هزینه" : "ثبت هزینه جدید"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                هزینه‌ها مستقل از فاکتور و پرداخت مشتری ثبت می‌شوند.
              </p>
            </div>
            <button type="button" onClick={closeForm} disabled={saving} className="text-sm text-gray-500 hover:text-gray-900">
              بستن
            </button>
          </div>

          {formError ? (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">عنوان هزینه</label>
              <input
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="مثلاً خرید ملزومات اداری"
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">مبلغ</label>
              <FormattedNumberInput
                required
                min="0.01"
                step="0.01"
                dir="ltr"
                value={form.amount}
                onValueChange={(value) => setForm((current) => ({ ...current, amount: value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right"
                placeholder="مثلاً 1,500,000"
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">دسته‌بندی</label>
              <select
                required
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={saving}
              >
                {EXPENSE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">تاریخ هزینه</label>
              <JalaliDateInput
                value={form.expense_date}
                onChange={(value) => setForm((current) => ({ ...current, expense_date: value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={saving}
                required
                aria-label="تاریخ هزینه"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">پرداخت‌کننده / مسئول هزینه</label>
              <select
                value={form.employee_id}
                onChange={(event) => setForm((current) => ({ ...current, employee_id: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={saving}
              >
                <option value="">بدون ثبت شخص</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{`${employee.first_name} ${employee.last_name}`}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">توضیحات</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="توضیحات تکمیلی در صورت نیاز"
                disabled={saving}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
              {saving ? "در حال ذخیره..." : "ذخیره هزینه"}
            </button>
            <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              انصراف
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="جستجوی عنوان یا توضیحات"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">همه دسته‌بندی‌ها</option>
          {EXPENSE_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={employeeId} onChange={(event) => { setEmployeeId(event.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">همه مسئولان</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{`${employee.first_name} ${employee.last_name}`}</option>)}
        </select>
        <JalaliDateInput value={dateFrom} onChange={(value) => { setDateFrom(value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="از تاریخ" />
        <JalaliDateInput value={dateTo} onChange={(value) => { setDateTo(value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="تا تاریخ" />
        <button type="button" onClick={resetFilters} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:col-span-5 lg:w-fit">
          پاک کردن فیلترها
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
        <span>{numberFormatter.format(total)} هزینه</span>
        <span>مجموع این صفحه: {numberFormatter.format(pageTotal)}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[1050px] w-full text-sm">
          <thead className="bg-gray-50 text-right text-gray-600">
            <tr>
              <th className="px-5 py-3 font-medium">عنوان</th>
              <th className="px-5 py-3 font-medium">دسته‌بندی</th>
              <th className="px-5 py-3 font-medium">مبلغ</th>
              <th className="px-5 py-3 font-medium">تاریخ</th>
              <th className="px-5 py-3 font-medium">مسئول هزینه</th>
              <th className="px-5 py-3 font-medium">ثبت‌کننده</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">در حال دریافت هزینه‌ها...</td></tr>
            ) : null}
            {!loading && expenses.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">هزینه‌ای پیدا نشد.</td></tr>
            ) : null}
            {!loading ? expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900">{expense.title}</div>
                  {expense.description ? <div className="mt-1 max-w-xs truncate text-xs text-gray-500">{expense.description}</div> : null}
                </td>
                <td className="px-5 py-4">{getExpenseCategoryLabel(expense.category)}</td>
                <td dir="ltr" className="px-5 py-4 font-semibold">{numberFormatter.format(Number(expense.amount || 0))}</td>
                <td className="px-5 py-4">{formatDate(expense.expense_date)}</td>
                <td className="px-5 py-4">{expense.employee?.name ?? "—"}</td>
                <td className="px-5 py-4">{expense.created_by?.name ?? "—"}</td>
                <td className="px-5 py-4 text-left">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEdit(expense)} disabled={!isManager || deletingId !== null} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                      ویرایش
                    </button>
                    <button type="button" onClick={() => void handleDelete(expense)} disabled={!isManager || deletingId !== null} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">
                      {deletingId === expense.id ? "در حال حذف..." : "حذف"}
                    </button>
                  </div>
                </td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">قبلی</button>
          <span className="text-sm text-gray-600">صفحه {numberFormatter.format(page)} از {numberFormatter.format(lastPage)}</span>
          <button type="button" disabled={page >= lastPage || loading} onClick={() => setPage((current) => Math.min(lastPage, current + 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">بعدی</button>
        </div>
      ) : null}
    </section>
  );
}
