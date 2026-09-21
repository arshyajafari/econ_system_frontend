import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { IranAddressFields } from "../../../components/IranAddressFields";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import {
  EMPLOYEE_ROLE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  type Employee,
  type EmployeeFormData,
  type Gender,
} from "../types/employee";

type Props = {
  employee?: Employee | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
};
const emptyForm: EmployeeFormData = {
  first_name: "",
  last_name: "",
  national_code: "",
  phone_number: "",
  card_number: "",
  iban_number: "",
  social_link: "",
  email: "",
  gender: "male",
  birth_date: "",
  employment_type: "full_time",
  activities: ["other"],
  hire_date: "",
  termination_date: "",
  status: "active",
  login: "",
  password: "",
  password_confirmation: "",
  roles: ["sales visitor"],
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
const roleActivityMap: Record<EmployeeRole, EmployeeActivityType> = {
  admin: "admin",
  "sales visitor": "sales_visitor",
  "scientific visitor": "scientific_visitor",
  accountant: "accountant",
  "settlement operator": "settlement_operator",
  "delivery operator": "delivery_operator",
};
function toForm(employee: Employee): EmployeeFormData {
  const roles = (employee.user?.roles ?? []).filter(
    (role): role is EmployeeRole =>
      EMPLOYEE_ROLE_OPTIONS.some((option) => option.value === role),
  );
  const fallbackRole = Object.entries(roleActivityMap).find(([, activity]) =>
    employee.activities?.includes(activity),
  )?.[0] as EmployeeRole | undefined;
  return {
    first_name: employee.first_name,
    last_name: employee.last_name,
    national_code: employee.national_code,
    phone_number: employee.phone_number,
    card_number: employee.card_number ?? "",
    iban_number: (employee.iban_number ?? "")
      .replace(/^IR/i, "")
      .replace(/\D/g, "")
      .slice(0, 24),
    social_link: employee.social_link ?? "",
    email: employee.email ?? "",
    gender: employee.gender,
    birth_date: employee.birth_date?.slice(0, 10) ?? "",
    employment_type: employee.employment_type,
    activities: employee.activities?.length
      ? employee.activities
      : [employee.activity_type ?? "other"],
    hire_date: employee.hire_date?.slice(0, 10) ?? "",
    termination_date: employee.termination_date?.slice(0, 10) ?? "",
    status: employee.status,
    login: "",
    password: "",
    password_confirmation: "",
    roles: roles.length
      ? roles
      : fallbackRole
        ? [fallbackRole]
        : ["sales visitor"],
    address: {
      province: employee.address?.province ?? "",
      city: employee.address?.city ?? "",
      address: employee.address?.address ?? "",
      postal_code: employee.address?.postal_code ?? "",
      latitude: employee.address?.latitude?.toString() ?? "",
      longitude: employee.address?.longitude?.toString() ?? "",
    },
    description: employee.description ?? "",
  };
}
export function EmployeeForm({
  employee,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<EmployeeFormData>(() =>
    employee ? toForm(employee) : emptyForm,
  );
  const input =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100";
  const update = <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const updateAddress = (
    key: keyof EmployeeFormData["address"],
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      address: { ...current.address, [key]: value },
    }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.national_code.trim() ||
      !form.phone_number.trim() ||
      !form.hire_date ||
      form.roles.length === 0 ||
      form.activities.length === 0 ||
      (!employee &&
        (!form.login.trim() || !form.password || !form.password_confirmation))
    )
      return;
    onSubmit({
      ...form,
      iban_number: form.iban_number
        ? `IR${form.iban_number.replace(/\D/g, "").slice(0, 24)}`
        : "",
    });
  }
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          {employee ? "ویرایش کارمند" : "کارمند جدید"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          اطلاعات شغلی، دسترسی ورود و آدرس کارمند را ثبت کنید.
        </p>
      </div>
      {error ? (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="نام" required>
            <input
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="نام خانوادگی" required>
            <input
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="کد ملی" required>
            <input
              dir="ltr"
              value={form.national_code}
              onChange={(e) => update("national_code", e.target.value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="شماره موبایل" required>
            <input
              dir="ltr"
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="ایمیل">
            <input
              dir="ltr"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="شماره کارت">
            <input
              dir="ltr"
              inputMode="numeric"
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              value={form.card_number
                .replace(/\D/g, "")
                .replace(/(.{4})/g, "$1 ")
                .trim()}
              onChange={(e) =>
                update(
                  "card_number",
                  e.target.value.replace(/\D/g, "").slice(0, 16),
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100"
            />
          </Field>
          <Field label="شماره شبا">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm font-semibold text-gray-500">
                IR
              </span>
              <input
                dir="ltr"
                inputMode="numeric"
                maxLength={29}
                placeholder="59-0300-1234-5678-9012-3456-78"
                value={form.iban_number
                  .replace(/\D/g, "")
                  .replace(/(.{4})/g, "$1-")
                  .replace(/-$/, "")}
                onChange={(e) =>
                  update(
                    "iban_number",
                    e.target.value.replace(/\D/g, "").slice(0, 24),
                  )
                }
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100"
              />
            </div>
          </Field>
          <Field label="لینک شبکه اجتماعی">
            <input
              dir="ltr"
              value={form.social_link}
              onChange={(e) => update("social_link", e.target.value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="جنسیت" required>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as Gender)}
              disabled={isSubmitting}
              className={input}
            >
              <option value="male">آقا</option>
              <option value="female">خانم</option>
            </select>
          </Field>
          <Field label="نوع استخدام" required>
            <select
              value={form.employment_type}
              onChange={(e) =>
                update(
                  "employment_type",
                  e.target.value as EmployeeFormData["employment_type"],
                )
              }
              disabled={isSubmitting}
              className={input}
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="تاریخ تولد">
            <JalaliDateInput
              value={form.birth_date}
              onChange={(value) => update("birth_date", value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="تاریخ استخدام" required>
            <JalaliDateInput
              value={form.hire_date}
              onChange={(value) => update("hire_date", value)}
              disabled={isSubmitting}
              required
              className={input}
            />
          </Field>
          <Field label="تاریخ پایان همکاری">
            <JalaliDateInput
              value={form.termination_date}
              onChange={(value) => update("termination_date", value)}
              disabled={isSubmitting}
              className={input}
            />
          </Field>
          <Field label="وضعیت" required>
            <select
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value as EmployeeFormData["status"])
              }
              disabled={isSubmitting}
              className={input}
            >
              {EMPLOYEE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <h3 className="mb-4 text-sm font-semibold">آدرس</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <IranAddressFields
              province={form.address.province}
              city={form.address.city}
              onProvinceChange={(value) => updateAddress("province", value)}
              onCityChange={(value) => updateAddress("city", value)}
              disabled={isSubmitting}
            />
            <Field label="کد پستی">
              <input
                dir="ltr"
                value={form.address.postal_code}
                onChange={(e) => updateAddress("postal_code", e.target.value)}
                disabled={isSubmitting}
                className={input}
              />
            </Field>
            <Field label="آدرس">
              <textarea
                rows={1}
                value={form.address.address}
                onChange={(e) => updateAddress("address", e.target.value)}
                disabled={isSubmitting}
                className={input}
              />
            </Field>
          </div>
        </div>
        <Field label="توضیحات">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            disabled={isSubmitting}
            className={input}
          />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border px-4 py-2.5 text-sm disabled:opacity-60"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !form.first_name.trim() ||
              !form.last_name.trim() ||
              !form.national_code.trim() ||
              !form.phone_number.trim() ||
              !form.hire_date ||
              form.activities.length === 0 ||
              form.roles.length === 0 ||
              (!employee &&
                (!form.login.trim() ||
                  !form.password ||
                  !form.password_confirmation))
            }
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting
              ? "در حال ذخیره..."
              : employee
                ? "ذخیره تغییرات"
                : "ثبت کارمند"}
          </button>
        </div>
      </form>
    </section>
  );
}
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
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
