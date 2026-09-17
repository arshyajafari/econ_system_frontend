import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { EMPLOYEE_ACTIVITY_OPTIONS, EMPLOYEE_ROLE_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, EMPLOYEE_STATUS_OPTIONS, type Employee, type EmployeeFormData, type Gender, type EmployeeActivityType, type EmployeeRole } from "../types/employee";

type Props = { employee?: Employee | null; isSubmitting: boolean; error: string | null; onSubmit: (data: EmployeeFormData) => void; onCancel: () => void; };

const emptyForm: EmployeeFormData = {
  first_name: "", last_name: "", national_code: "", phone_number: "", social_link: "", email: "", gender: "male", birth_date: "",
  employment_type: "full_time", activities: ["other"], hire_date: "", termination_date: "", status: "active", login: "", password: "", password_confirmation: "", roles: ["sales visitor"],
  address: { province: "", city: "", address: "", postal_code: "", latitude: "", longitude: "" }, description: "",
};

function toForm(employee: Employee): EmployeeFormData {
  return {
    first_name: employee.first_name, last_name: employee.last_name, national_code: employee.national_code, phone_number: employee.phone_number,
    social_link: employee.social_link ?? "", email: employee.email ?? "", gender: employee.gender, birth_date: employee.birth_date?.slice(0, 10) ?? "",
    employment_type: employee.employment_type, activities: employee.activities?.length ? employee.activities : [employee.activity_type ?? "other"], hire_date: employee.hire_date?.slice(0, 10) ?? "",
    termination_date: employee.termination_date?.slice(0, 10) ?? "", status: employee.status, login: "", password: "", password_confirmation: "",
    roles: (employee.user?.roles ?? []) as EmployeeRole[], address: { province: employee.address?.province ?? "", city: employee.address?.city ?? "", address: employee.address?.address ?? "", postal_code: employee.address?.postal_code ?? "", latitude: employee.address?.latitude?.toString() ?? "", longitude: employee.address?.longitude?.toString() ?? "" }, description: employee.description ?? "",
  };
}

export function EmployeeForm({ employee, isSubmitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(() => employee ? toForm(employee) : emptyForm);
  const input = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100";
  const update = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateAddress = (key: keyof EmployeeFormData["address"], value: string) => setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  const toggle = <T extends string>(key: "activities" | "roles", value: T) => setForm((current) => {
    const values = current[key] as T[];
    const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
    return { ...current, [key]: next } as EmployeeFormData;
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.national_code.trim() || !form.phone_number.trim() || !form.hire_date || form.activities.length === 0 || (!employee && (!form.login.trim() || !form.password || !form.password_confirmation || form.roles.length === 0))) return;
    onSubmit(form);
  }

  return <section className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="mb-6"><h2 className="text-lg font-semibold">{employee ? "ویرایش کارمند" : "کارمند جدید"}</h2><p className="mt-1 text-sm text-gray-500">اطلاعات شغلی، دسترسی ورود و آدرس کارمند را ثبت کنید.</p></div>
    {error ? <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="نام" required><input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="نام خانوادگی" required><input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="کد ملی" required><input dir="ltr" value={form.national_code} onChange={(e) => update("national_code", e.target.value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="شماره موبایل" required><input dir="ltr" value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="ایمیل"><input dir="ltr" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="لینک شبکه اجتماعی"><input dir="ltr" value={form.social_link} onChange={(e) => update("social_link", e.target.value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="جنسیت" required><select value={form.gender} onChange={(e) => update("gender", e.target.value as Gender)} disabled={isSubmitting} className={input}><option value="male">آقا</option><option value="female">خانم</option></select></Field>
        <Field label="نوع استخدام" required><select value={form.employment_type} onChange={(e) => update("employment_type", e.target.value as EmployeeFormData["employment_type"])} disabled={isSubmitting} className={input}>{EMPLOYMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field label="تاریخ تولد"><JalaliDateInput value={form.birth_date} onChange={(value) => update("birth_date", value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="تاریخ استخدام" required><JalaliDateInput value={form.hire_date} onChange={(value) => update("hire_date", value)} disabled={isSubmitting} required className={input} /></Field>
        <Field label="تاریخ پایان همکاری"><JalaliDateInput value={form.termination_date} onChange={(value) => update("termination_date", value)} disabled={isSubmitting} className={input} /></Field>
        <Field label="وضعیت" required><select value={form.status} onChange={(e) => update("status", e.target.value as EmployeeFormData["status"])} disabled={isSubmitting} className={input}>{EMPLOYEE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
      </div>

      <div className="border-t border-gray-100 pt-6"><h3 className="mb-1 text-sm font-semibold">فعالیت‌های کاری</h3><p className="mb-4 text-xs text-gray-500">یک کارمند می‌تواند هم‌زمان چند فعالیت داشته باشد.</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">{EMPLOYEE_ACTIVITY_OPTIONS.map((o) => <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-gray-50"><input type="checkbox" checked={form.activities.includes(o.value)} onChange={() => toggle<EmployeeActivityType>("activities", o.value)} disabled={isSubmitting} />{o.label}</label>)}</div></div>

      <div className="border-t border-gray-100 pt-6"><div className="mb-4"><h3 className="text-sm font-semibold">حساب ورود و دسترسی</h3><p className="mt-1 text-xs text-gray-500">نقش‌ها از فعالیت شغلی جدا هستند و می‌توان چند نقش را هم‌زمان اختصاص داد.</p></div><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><Field label="نام کاربری" required={!employee}><input dir="ltr" autoComplete="username" value={form.login} onChange={(e) => update("login", e.target.value)} disabled={isSubmitting} placeholder={employee ? "برای تغییر وارد کنید" : "مثلاً ahmad"} className={input} /></Field><Field label={employee ? "رمز عبور جدید" : "رمز عبور"} required={!employee}><input dir="ltr" type="password" autoComplete={employee ? "new-password" : "new-password"} value={form.password} onChange={(e) => update("password", e.target.value)} disabled={isSubmitting} className={input} /></Field><Field label="تکرار رمز عبور" required={!employee}><input dir="ltr" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => update("password_confirmation", e.target.value)} disabled={isSubmitting} className={input} /></Field></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">{EMPLOYEE_ROLE_OPTIONS.map((o) => <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-gray-50"><input type="checkbox" checked={form.roles.includes(o.value)} onChange={() => toggle<EmployeeRole>("roles", o.value)} disabled={isSubmitting} />{o.label}</label>)}</div></div>

      <div className="border-t border-gray-100 pt-6"><h3 className="mb-4 text-sm font-semibold">آدرس</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Field label="استان"><input value={form.address.province} onChange={(e) => updateAddress("province", e.target.value)} disabled={isSubmitting} className={input} /></Field><Field label="شهر"><input value={form.address.city} onChange={(e) => updateAddress("city", e.target.value)} disabled={isSubmitting} className={input} /></Field><Field label="کد پستی"><input dir="ltr" value={form.address.postal_code} onChange={(e) => updateAddress("postal_code", e.target.value)} disabled={isSubmitting} className={input} /></Field><Field label="آدرس"><textarea rows={2} value={form.address.address} onChange={(e) => updateAddress("address", e.target.value)} disabled={isSubmitting} className={input} /></Field></div></div>
      <Field label="توضیحات"><textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} disabled={isSubmitting} className={input} /></Field>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border px-4 py-2.5 text-sm disabled:opacity-60">انصراف</button><button type="submit" disabled={isSubmitting || !form.first_name.trim() || !form.last_name.trim() || !form.national_code.trim() || !form.phone_number.trim() || !form.hire_date || form.activities.length === 0 || (!employee && (!form.login.trim() || !form.password || !form.password_confirmation || form.roles.length === 0))} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{isSubmitting ? "در حال ذخیره..." : employee ? "ذخیره تغییرات" : "ثبت کارمند"}</button></div>
    </form>
  </section>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}{required ? <span className="mr-1 text-red-600">*</span> : null}</label>{children}</div>; }
