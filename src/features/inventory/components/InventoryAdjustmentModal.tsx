import { useState } from "react";
import { ApiError } from "../../../api/client";
import { adjustInventory } from "../services/inventoryApi";
import type { InventoryBatch } from "../types/inventory";

type InventoryAdjustmentModalProps = {
  batch: InventoryBatch;
  onClose: () => void;
  onSaved: () => void;
};

export function InventoryAdjustmentModal({
  batch,
  onClose,
  onSaved,
}: InventoryAdjustmentModalProps) {
  const [type, setType] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (quantity < 1 || !reason.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await adjustInventory({
        inventory_batch_id: batch.id,
        type,
        quantity,
        reason: reason.trim(),
        description: description.trim() || undefined,
      });
      onSaved();
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "خطا در اصلاح موجودی. دوباره تلاش کنید.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
        aria-labelledby="inventory-adjustment-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="inventory-adjustment-title" className="text-lg font-bold">
            اصلاح موجودی
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5"
          >
            بستن
          </button>
        </div>

        <p className="text-sm text-gray-600">
          {batch.product?.title ?? "—"} — بچ {batch.batch_number || "بدون شماره"} — موجودی فعلی: {batch.quantity}
        </p>
        <p className="text-xs text-gray-500">
          هر اصلاح با علت و گردش انبار ثبت می‌شود و در سوابق قابل پیگیری است.
        </p>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="inventory-adjustment-type" className="mb-1 block text-sm font-medium">
            نوع اصلاح
          </label>
          <select
            id="inventory-adjustment-type"
            value={type}
            disabled={saving}
            onChange={(event) => setType(event.target.value as "increase" | "decrease")}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="increase">افزایش موجودی</option>
            <option value="decrease">کاهش موجودی</option>
          </select>
        </div>

        <div>
          <label htmlFor="inventory-adjustment-quantity" className="mb-1 block text-sm font-medium">
            تعداد
          </label>
          <input
            id="inventory-adjustment-quantity"
            type="number"
            min={1}
            max={type === "decrease" ? batch.available_quantity : undefined}
            required
            disabled={saving}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="w-full rounded-lg border px-3 py-2"
          />
          {type === "decrease" && (
            <p className="mt-1 text-xs text-gray-500">
              حداکثر کاهش مجاز: {batch.available_quantity} (موجودی قابل استفاده، بدون اقلام رزروشده)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="inventory-adjustment-reason" className="mb-1 block text-sm font-medium">
            علت اصلاح
          </label>
          <input
            id="inventory-adjustment-reason"
            required
            maxLength={300}
            disabled={saving}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="مثلاً مغایرت شمارش فیزیکی"
          />
        </div>

        <div>
          <label htmlFor="inventory-adjustment-description" className="mb-1 block text-sm font-medium">
            توضیحات تکمیلی (اختیاری)
          </label>
          <textarea
            id="inventory-adjustment-description"
            maxLength={2000}
            disabled={saving}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-20 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={saving || quantity < 1 || !reason.trim() || (type === "decrease" && quantity > batch.available_quantity)}
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {saving ? "در حال ثبت..." : "ثبت اصلاح و گردش انبار"}
        </button>
      </form>
    </div>
  );
}
