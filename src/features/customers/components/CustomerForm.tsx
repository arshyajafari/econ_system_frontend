import { useState } from "react";

import type { Customer, CustomerFormData } from "../types/customer";

type CustomerFormProps = {
  customer?: Customer | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
};

const emptyForm: CustomerFormData = {
  customer_name: "",
  type: "pharmacy",
  owner_name: "",
  manager_name: "",
  economic_code: "",
  national_code: "",
  phone_number: "",
  telephone_number: "",
  social_address: "",
  status: "active",
  address: {
    province: "",
    city: "",
    address: "",
    postal_code: "",
    latitude: "",
    longitude: "",
  },
  description: "",
};

function customerToForm(customer: Customer): CustomerFormData {
  return {
    customer_name: customer.customer_name,
    type: customer.type,
    owner_name: customer.owner_name ?? "",
    manager_name: customer.manager_name ?? "",
    economic_code: customer.economic_code ?? "",
    national_code: customer.national_code ?? "",
    phone_number: customer.phone_number,
    telephone_number: customer.telephone_number ?? "",
    social_address: customer.social_address ?? "",
    status: customer.status,
    address: {
      province: customer.address?.province ?? "",
      city: customer.address?.city ?? "",
      address: customer.address?.address ?? "",
      postal_code: customer.address?.postal_code ?? "",
      latitude: customer.address?.latitude?.toString() ?? "",
      longitude: customer.address?.longitude?.toString() ?? "",
    },
    description: customer.description ?? "",
  };
}

export function CustomerForm({
  customer,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>(() =>
    customer ? customerToForm(customer) : emptyForm,
  );

  function update<K extends keyof CustomerFormData>(
    key: K,
    value: CustomerFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateAddress(
    key: keyof CustomerFormData["address"],
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [key]: value,
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.customer_name.trim()) {
      return;
    }

    if (!form.phone_number.trim()) {
      return;
    }

    onSubmit(form);
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {customer ? "ویرایش مشتری" : "مشتری جدید"}
        </h2>
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
          <Field label="نام مشتری" required>
            <input
              value={form.customer_name}
              onChange={(event) => update("customer_name", event.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>

          <Field label="نوع مشتری" required>
            <select
              value={form.type}
              onChange={(event) =>
                update("type", event.target.value as CustomerFormData["type"])
              }
              disabled={isSubmitting}
              className={inputClass}
            >
              <option value="pharmacy">داروخانه</option>
              <option value="clinic">کلینیک</option>
              <option value="hospital">بیمارستان</option>
              <option value="wholesaler">عمده‌فروش</option>
              <option value="store">فروشگاه</option>
              <option value="other">سایر</option>
            </select>
          </Field>

          <Field label="نام مالک">
            <input
              value={form.owner_name}
              onChange={(event) => update("owner_name", event.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>

          <Field label="نام مدیر">
            <input
              value={form.manager_name}
              onChange={(event) => update("manager_name", event.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>

          <Field label="شماره موبایل" required>
            <input
              dir="ltr"
              value={form.phone_number}
              onChange={(event) => update("phone_number", event.target.value)}
              disabled={isSubmitting}
              className={`${inputClass} text-right`}
            />
          </Field>

          <Field label="شماره تلفن ثابت">
            <input
              dir="ltr"
              value={form.telephone_number}
              onChange={(event) =>
                update("telephone_number", event.target.value)
              }
              disabled={isSubmitting}
              className={`${inputClass} text-right`}
            />
          </Field>

          <Field label="کد ملی">
            <input
              dir="ltr"
              value={form.national_code}
              onChange={(event) => update("national_code", event.target.value)}
              disabled={isSubmitting}
              className={`${inputClass} text-right`}
            />
          </Field>

          <Field label="کد اقتصادی">
            <input
              dir="ltr"
              value={form.economic_code}
              onChange={(event) => update("economic_code", event.target.value)}
              disabled={isSubmitting}
              className={`${inputClass} text-right`}
            />
          </Field>

          <Field label="آدرس شبکه اجتماعی / ایمیل">
            <input
              dir="ltr"
              type="email"
              value={form.social_address}
              onChange={(event) => update("social_address", event.target.value)}
              disabled={isSubmitting}
              className={`${inputClass} text-right`}
            />
          </Field>

          <Field label="وضعیت">
            <select
              value={form.status}
              onChange={(event) =>
                update(
                  "status",
                  event.target.value as CustomerFormData["status"],
                )
              }
              disabled={isSubmitting}
              className={inputClass}
            >
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="blocked">مسدود</option>
            </select>
          </Field>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">آدرس</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="استان">
              <input
                value={form.address.province}
                onChange={(event) =>
                  updateAddress("province", event.target.value)
                }
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="شهر">
              <input
                value={form.address.city}
                onChange={(event) => updateAddress("city", event.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
            </Field>

            <Field label="کد پستی">
              <input
                dir="ltr"
                value={form.address.postal_code}
                onChange={(event) =>
                  updateAddress("postal_code", event.target.value)
                }
                disabled={isSubmitting}
                className={`${inputClass} text-right`}
              />
            </Field>

            <Field label="آدرس">
              <textarea
                value={form.address.address}
                onChange={(event) =>
                  updateAddress("address", event.target.value)
                }
                disabled={isSubmitting}
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <Field label="توضیحات">
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
            disabled={
              isSubmitting ||
              !form.customer_name.trim() ||
              !form.phone_number.trim()
            }
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "در حال ذخیره..."
              : customer
                ? "ذخیره تغییرات"
                : "ثبت مشتری"}
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
