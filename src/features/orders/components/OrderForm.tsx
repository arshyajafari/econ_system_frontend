import { useState } from "react";

import { OrderItemsEditor } from "./OrderItemsEditor";

import type {
  Order,
  OrderCustomerOption,
  OrderEmployeeOption,
  OrderFormData,
  OrderProductOption,
} from "../types/order";

type OrderFormProps = {
  order?: Order | null;
  customers: OrderCustomerOption[];
  employees: OrderEmployeeOption[];
  products: OrderProductOption[];
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100";

function orderToForm(order: Order): OrderFormData {
  return {
    customer_id: order.customer?.id ?? "",
    sales_employee_id: order.sales_employee?.id ?? "",
    description: order.description ?? "",
    items: order.items.map((item) => ({
      product_id: item.product?.id ?? "",
      quantity: item.quantity,
      unit_price: String(item.unit_price),
      description: item.description ?? "",
    })),
  };
}

const emptyForm: OrderFormData = {
  customer_id: "",
  sales_employee_id: "",
  description: "",
  items: [
    {
      product_id: "",
      quantity: 1,
      unit_price: "",
      description: "",
    },
  ],
};

export function OrderForm({
  order,
  customers,
  employees,
  products,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: OrderFormProps) {
  const [form, setForm] = useState<OrderFormData>(() =>
    order ? orderToForm(order) : emptyForm,
  );

  function update<K extends keyof OrderFormData>(
    key: K,
    value: OrderFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.customer_id) {
      return;
    }

    if (!form.sales_employee_id) {
      return;
    }

    if (
      form.items.length === 0 ||
      form.items.some(
        (item) =>
          !item.product_id ||
          item.quantity < 1 ||
          item.unit_price === "" ||
          Number(item.unit_price) < 0,
      )
    ) {
      return;
    }

    onSubmit(form);
  }

  const isValid =
    Boolean(form.customer_id) &&
    Boolean(form.sales_employee_id) &&
    form.items.length > 0 &&
    form.items.every(
      (item) =>
        Boolean(item.product_id) &&
        item.quantity >= 1 &&
        item.unit_price !== "" &&
        Number(item.unit_price) >= 0,
    );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {order ? "ویرایش سفارش" : "سفارش جدید"}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          سفارش ابتدا به صورت پیش‌نویس ثبت می‌شود.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="مشتری" required>
            <select
              value={form.customer_id}
              onChange={(event) => update("customer_id", event.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            >
              <option value="">انتخاب مشتری</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name} — {customer.code}
                </option>
              ))}
            </select>
          </Field>

          <Field label="کارشناس فروش" required>
            <select
              value={form.sales_employee_id}
              onChange={(event) =>
                update("sales_employee_id", event.target.value)
              }
              disabled={isSubmitting}
              className={inputClass}
            >
              <option value="">انتخاب کارشناس فروش</option>

              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} — {employee.code}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <OrderItemsEditor
          items={form.items}
          products={products}
          disabled={isSubmitting}
          onChange={(items) => update("items", items)}
        />

        <Field label="توضیحات سفارش">
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            disabled={isSubmitting}
            rows={4}
            className={inputClass}
          />
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            انصراف
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "در حال ذخیره..."
              : order
                ? "ذخیره تغییرات"
                : "ثبت سفارش"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required ? <span className="mr-1 text-red-600">*</span> : null}
      </label>

      {children}
    </div>
  );
}
