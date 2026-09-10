import { useEffect, useMemo, useState } from "react";

import { ApiError } from "../../../api/client";

import {
  allocateOrderReturnItem,
  getInventoryBatches,
} from "../services/orderReturnsApi";

import type { InventoryBatch, OrderReturnItem } from "../types/orderReturn";

type Props = {
  item: OrderReturnItem;
  disabled?: boolean;
  onSaved: () => void;
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR").format(date);
}

export function OrderReturnAllocationForm({
  item,
  disabled = false,
  onSaved,
}: Props) {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredQuantity = Number(item.quantity || 0);

  const allocatedQuantity = useMemo(
    () =>
      Object.values(quantities).reduce(
        (sum, quantity) => sum + Number(quantity || 0),
        0,
      ),
    [quantities],
  );

  const remainingQuantity = Math.max(0, requiredQuantity - allocatedQuantity);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!item.product?.id) {
        if (active) {
          setBatches([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getInventoryBatches(item.product.id);

        if (!active) {
          return;
        }

        setBatches(result);

        const existing: Record<string, number> = {};

        for (const allocation of item.allocations ?? []) {
          if (allocation.inventory_batch_id) {
            existing[allocation.inventory_batch_id] = Number(
              allocation.quantity || 0,
            );
          }
        }

        setQuantities(existing);
      } catch (loadError: unknown) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof ApiError && loadError.message
            ? loadError.message
            : "خطا در دریافت موجودی بچ‌های محصول.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [item]);

  function handleQuantityChange(batch: InventoryBatch, value: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setQuantities((current) => {
        const next = { ...current };
        delete next[batch.id];
        return next;
      });

      return;
    }

    const normalized = Math.min(
      Math.trunc(parsed),
      Number(batch.available_quantity || 0),
    );

    setQuantities((current) => ({
      ...current,
      [batch.id]: normalized,
    }));
  }

  async function handleSave() {
    if (!item.id || disabled || isSaving) {
      return;
    }

    if (allocatedQuantity !== requiredQuantity) {
      setError(
        `مجموع تخصیص باید دقیقاً ${formatNumber(requiredQuantity)} عدد باشد.`,
      );

      return;
    }

    const allocations = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([inventoryBatchId, quantity]) => ({
        inventory_batch_id: inventoryBatchId,
        quantity,
      }));

    if (allocations.length === 0) {
      setError("حداقل یک بچ باید انتخاب شود.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await allocateOrderReturnItem(item.id, allocations);

      onSaved();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof ApiError && saveError.message
          ? saveError.message
          : "ذخیره تخصیص انجام نشد.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!item.product?.id) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
        محصول این قلم مشخص نیست؛ امکان تخصیص موجودی وجود ندارد.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
        در حال دریافت بچ‌های موجودی...
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">تخصیص موجودی</h3>

          <p className="mt-1 text-xs text-gray-500">
            {item.product.title}
            {item.product.code ? ` — ${item.product.code}` : ""}
          </p>
        </div>

        <div className="text-sm">
          <span className="text-gray-500">مورد نیاز:</span>{" "}
          <strong>{formatNumber(requiredQuantity)}</strong>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {batches.length === 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          برای این محصول موجودی قابل تخصیص پیدا نشد.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-gray-50 text-right text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">بچ</th>

                <th className="px-4 py-3 font-medium">تاریخ انقضا</th>

                <th className="px-4 py-3 font-medium">موجودی قابل تخصیص</th>

                <th className="px-4 py-3 font-medium">مقدار برگشتی</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {batches.map((batch) => {
                const currentQuantity = quantities[batch.id] ?? 0;

                return (
                  <tr key={batch.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {batch.batch_number ?? "بدون بچ"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(batch.expire_date)}
                    </td>

                    <td className="px-4 py-3">
                      {formatNumber(Number(batch.available_quantity || 0))}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={Number(batch.available_quantity || 0)}
                        step={1}
                        value={currentQuantity === 0 ? "" : currentQuantity}
                        disabled={disabled || isSaving}
                        onChange={(event) => {
                          handleQuantityChange(batch, event.target.value);
                        }}
                        className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="text-gray-500">تخصیص فعلی:</span>{" "}
          <strong>{formatNumber(allocatedQuantity)}</strong>{" "}
          <span className="text-gray-400">
            / {formatNumber(requiredQuantity)}
          </span>
          {remainingQuantity > 0 ? (
            <span className="mr-2 text-yellow-700">
              ({formatNumber(remainingQuantity)} باقی‌مانده)
            </span>
          ) : null}
        </div>

        <button
          type="button"
          disabled={
            disabled || isSaving || allocatedQuantity !== requiredQuantity
          }
          onClick={() => {
            void handleSave();
          }}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "در حال ذخیره..." : "ذخیره تخصیص"}
        </button>
      </div>
    </div>
  );
}
