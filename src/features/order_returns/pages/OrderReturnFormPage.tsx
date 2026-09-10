import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../../../api/client";

import {
  createOrderReturn,
  getOrderReturn,
  updateOrderReturn,
} from "../services/orderReturnsApi";

import type { OrderReturn, OrderReturnFormData } from "../types/orderReturn";

import { getOrder } from "../../orders/services/ordersApi";

import type { Order } from "../../orders/types/order";

type FormItem = {
  orderItemId: string;

  quantity: number;

  description: string;
};

export function OrderReturnFormPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("order_id");

  const returnId = searchParams.get("return_id");

  const [order, setOrder] = useState<Order | null>(null);

  const [existingReturn, setExistingReturn] = useState<OrderReturn | null>(
    null,
  );

  const [description, setDescription] = useState("");

  const [items, setItems] = useState<FormItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderId && !returnId) {
        setError("سفارش برای ثبت مرجوعی مشخص نشده است.");

        setIsLoading(false);

        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (returnId) {
          const response = await getOrderReturn(returnId);

          if (cancelled) {
            return;
          }

          setExistingReturn(response);

          setDescription(response.description ?? "");

          setItems(
            response.items.map((item) => ({
              orderItemId: item.order_item_id ?? item.id,

              quantity: Number(item.quantity),

              description: item.description ?? "",
            })),
          );

          if (response.order?.id) {
            const loadedOrder = await getOrder(response.order.id);

            if (!cancelled) {
              setOrder(loadedOrder);
            }
          }
        } else if (orderId) {
          const loadedOrder = await getOrder(orderId);

          if (cancelled) {
            return;
          }

          setOrder(loadedOrder);

          if (loadedOrder.status !== "completed") {
            setError("فقط سفارش تکمیل‌شده قابل ثبت مرجوعی است.");
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setError(
            error instanceof ApiError && error.message
              ? error.message
              : "دریافت اطلاعات ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [orderId, returnId]);

  function toggleItem(orderItemId: string) {
    setItems((current) => {
      const exists = current.some((item) => item.orderItemId === orderItemId);

      if (exists) {
        return current.filter((item) => item.orderItemId !== orderItemId);
      }

      return [
        ...current,
        {
          orderItemId,
          quantity: 1,
          description: "",
        },
      ];
    });
  }

  function updateItem(orderItemId: string, changes: Partial<FormItem>) {
    setItems((current) =>
      current.map((item) =>
        item.orderItemId === orderItemId
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    );
  }

  async function handleSubmit() {
    if (isSaving) {
      return;
    }

    if (!order) {
      setError("اطلاعات سفارش موجود نیست.");

      return;
    }

    if (items.length === 0) {
      setError("حداقل یک قلم برای مرجوعی انتخاب کنید.");

      return;
    }

    const normalizedItems = items.map((item) => ({
      order_item_id: item.orderItemId,

      quantity: Math.max(1, Math.trunc(Number(item.quantity))),

      description: item.description.trim(),
    }));

    const payload: OrderReturnFormData = {
      order_id: order.id,

      description: description.trim(),

      items: normalizedItems,
    };

    setIsSaving(true);
    setError(null);

    try {
      const response = existingReturn
        ? await updateOrderReturn(existingReturn.id, payload)
        : await createOrderReturn(payload);

      navigate(`/order-returns/${response.id}`);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "ذخیره مرجوعی ناموفق بود.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="p-4 md:p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          در حال دریافت اطلاعات...
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/order-returns")}
          className="mb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← بازگشت
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          {existingReturn ? "ویرایش مرجوعی" : "ثبت مرجوعی جدید"}
        </h1>

        {order ? (
          <p className="mt-1 text-sm text-gray-500">سفارش: {order.code}</p>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {order ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">انتخاب اقلام</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-50 text-right text-gray-600">
                  <tr>
                    <th className="px-5 py-3 font-medium">انتخاب</th>

                    <th className="px-5 py-3 font-medium">محصول</th>

                    <th className="px-5 py-3 font-medium">تعداد سفارش</th>

                    <th className="px-5 py-3 font-medium">تعداد مرجوعی</th>

                    <th className="px-5 py-3 font-medium">توضیحات</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {order.items.map((orderItem) => {
                    const selected = items.find(
                      (item) => item.orderItemId === orderItem.id,
                    );

                    return (
                      <tr key={orderItem.id}>
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleItem(orderItem.id)}
                            disabled={isSaving}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {orderItem.product?.title}
                          </div>

                          {orderItem.product?.code ? (
                            <div className="mt-1 text-xs text-gray-500">
                              {orderItem.product.code}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">{orderItem.quantity}</td>

                        <td className="px-5 py-4">
                          {selected ? (
                            <input
                              type="number"
                              min={1}
                              max={Number(orderItem.quantity)}
                              value={selected.quantity}
                              onChange={(event) =>
                                updateItem(orderItem.id, {
                                  quantity: Number(event.target.value),
                                })
                              }
                              disabled={isSaving}
                              className="w-24 rounded-lg border border-gray-300 px-3 py-2"
                            />
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {selected ? (
                            <input
                              value={selected.description}
                              onChange={(event) =>
                                updateItem(orderItem.id, {
                                  description: event.target.value,
                                })
                              }
                              disabled={isSaving}
                              placeholder="توضیح..."
                              className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <label
              htmlFor="order-return-description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              توضیحات مرجوعی
            </label>

            <textarea
              id="order-return-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
              placeholder="توضیحات..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/order-returns")}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={isSaving || order.status !== "completed"}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "در حال ذخیره..." : "ذخیره مرجوعی"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
