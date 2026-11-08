import type { FormEvent } from "react";
import { Button } from "../../../design-system/components/Button";
import type { ScientificInventoryItem } from "../types/scientificInventory";

type ScientificInventoryModalsProps = {
  editingItem: ScientificInventoryItem | null;
  deleteTarget: ScientificInventoryItem | null;
  saving: boolean;
  editQuantity: number;
  editDescription: string;
  onEditQuantityChange: (value: number) => void;
  onEditDescriptionChange: (value: string) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  formatQuantity: (value: number) => string;
};

export function ScientificInventoryModals({
  editingItem, deleteTarget, saving, editQuantity, editDescription,
  onEditQuantityChange, onEditDescriptionChange, onSubmitEdit, onCloseEdit,
  onCloseDelete, onConfirmDelete, formatQuantity,
}: ScientificInventoryModalsProps) {
  return (
    <>
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-scientific-inventory-title">
          <form onSubmit={onSubmitEdit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            <div>
              <h2 id="edit-scientific-inventory-title" className="text-lg font-bold">ویرایش نمونه تحویلی</h2>
              <p className="mt-1 text-sm text-gray-500">{editingItem.employee?.name ?? "—"} — {editingItem.product?.title ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div>دریافتی فعلی: <strong>{formatQuantity(editingItem.received_quantity)}</strong> عدد</div>
              <div>مصرف‌شده: <strong>{formatQuantity(editingItem.used_quantity)}</strong> عدد</div>
              <div>موجودی قابل استفاده: <strong>{formatQuantity(editingItem.available_quantity)}</strong> عدد</div>
            </div>
            <label className="w-full block space-y-1">
              <span className="text-sm font-medium">تعداد دریافتی جدید</span>
              <input required type="number" min={editingItem.used_quantity} step={1} disabled={saving} value={editQuantity} onChange={(event) => onEditQuantityChange(Number(event.target.value))} className="w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="w-full block space-y-1 mt-1">
              <span className="text-sm font-medium">توضیحات</span>
              <input disabled={saving} value={editDescription} onChange={(event) => onEditDescriptionChange(event.target.value)} className="w-full rounded-lg border px-3 py-2" />
            </label>
            <div className="flex justify-end gap-2 mt-2.5">
              <Button variant="secondary" type="button" onClick={onCloseEdit} disabled={saving} className="rounded-lg border px-4 py-2">انصراف</Button>
              <Button variant="primary" type="submit" disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-scientific-inventory-title">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            <div>
              <h2 id="delete-scientific-inventory-title" className="text-lg font-bold">حذف موجودی ویزیتور علمی</h2>
              <p className="mt-2 text-sm text-gray-600">
                آیا می‌خواهید ردیف موجودی «{deleteTarget.product?.title ?? "محصول"}» برای «{deleteTarget.employee?.name ?? "ویزیتور علمی"}» را حذف کنید؟
                موجودی استفاده‌نشده به بچ‌های انبار اصلی برمی‌گردد؛ مقدار مصرف‌شده و سوابق نمونه برای گزارش و حسابرسی حفظ می‌شود.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={onCloseDelete} disabled={saving} className="ui-btn-secondary rounded-lg border px-4 py-2 disabled:opacity-50">انصراف</Button>
              <Button variant="danger" type="button" onClick={onConfirmDelete} disabled={saving} className="ui-btn-delete rounded-lg border px-4 py-2 disabled:opacity-50">{saving ? "در حال حذف..." : "حذف موجودی"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
