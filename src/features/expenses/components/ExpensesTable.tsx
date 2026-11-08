import { Button } from "../../../design-system/components/Button";
import { TableContainer } from "../../../design-system/components/TableContainer";
import type { Expense } from "../types/expense";

type ExpensesTableProps = {
  expenses: Expense[];
  loading: boolean;
  isManager: boolean;
  isAdmin: boolean;
  deletingId: string | null;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  formatAmount: (amount: string | number | null | undefined) => string;
  formatDate: (value: string) => string;
  getCategoryLabel: (category: Expense["category"]) => string;
};

export function ExpensesTable({
  expenses,
  loading,
  isManager,
  isAdmin,
  deletingId,
  onEdit,
  onDelete,
  formatAmount,
  formatDate,
  getCategoryLabel,
}: ExpensesTableProps) {
  return (
    <TableContainer aria-label="جدول هزینه‌ها">
      <table className="min-w-[1050px] w-full text-sm">
        <thead className="bg-gray-50 text-right text-gray-600">
          <tr>
            <th className="px-5 py-3 font-medium">عنوان</th>
            <th className="px-5 py-3 font-medium">دسته‌بندی</th>
            <th className="px-5 py-3 font-medium">مبلغ</th>
            <th className="px-5 py-3 font-medium">تاریخ</th>
            <th className="px-5 py-3 font-medium">مسئول هزینه</th>
            <th className="px-5 py-3 font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">در حال دریافت هزینه‌ها...</td></tr>
          ) : null}
          {!loading && expenses.length === 0 ? (
            <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">هزینه‌ای پیدا نشد.</td></tr>
          ) : null}
          {!loading
            ? expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{expense.title}</div>
                    {expense.description ? <div className="mt-1 max-w-xs truncate text-xs text-gray-500">{expense.description}</div> : null}
                  </td>
                  <td className="px-5 py-4">{getCategoryLabel(expense.category)}</td>
                  <td dir="ltr" className="px-5 py-4 font-semibold">{formatAmount(expense.amount)}</td>
                  <td className="px-5 py-4">{formatDate(expense.expense_date)}</td>
                  <td className="px-5 py-4">{expense.employee?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-left">
                    <div className="flex justify-end gap-2">
                      <Button variant="edit" size="sm" type="button" onClick={() => onEdit(expense)} disabled={!isManager || deletingId !== null} className="ui-btn-edit rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50">ویرایش</Button>
                      {isAdmin ? (
                        <Button variant="danger" size="sm" type="button" onClick={() => onDelete(expense)} disabled={deletingId !== null} className="ui-btn-delete rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                          {deletingId === expense.id ? "در حال حذف..." : "حذف"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </TableContainer>
  );
}
