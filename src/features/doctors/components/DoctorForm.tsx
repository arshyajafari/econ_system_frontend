import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import type {
  Doctor,
  DoctorFormData,
  DoctorSpecialty,
} from "../types/doctor";

type DoctorFormProps = {
  doctor?: Doctor | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: DoctorFormData) => void;
  onCancel: () => void;
};

const specialties: Array<{ value: DoctorSpecialty; label: string }> = [
  { value: "متخصص پوست، مو و زیبایی", label: "متخصص پوست، مو و زیبایی" },
  { value: "پزشک عمومی", label: "پزشک عمومی" },
  { value: "متخصص پوست اطفال و کودکان", label: "متخصص پوست اطفال و کودکان" },
  { value: "متخصص آلرژی و ایمنی‌شناسی", label: "متخصص آلرژی و ایمنی‌شناسی" },
  { value: "متخصص ورید و عروق", label: "متخصص ورید و عروق" },
  { value: "متخصص غدد و متابولیسم", label: "متخصص غدد و متابولیسم" },
  { value: "متخصص تغذیه", label: "متخصص تغذیه" },
];

const emptyForm: DoctorFormData = {
  first_name: "",
  last_name: "",
  phone_number: "",
  clinic_name: "",
  specialty: "پزشک عمومی",
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

function doctorToForm(doctor: Doctor): DoctorFormData {
  return {
    first_name: doctor.first_name,
    last_name: doctor.last_name,
    phone_number: doctor.phone_number ?? "",
    clinic_name: doctor.clinic_name ?? "",
    specialty: doctor.specialty,
    status: doctor.status,
    address: {
      province: doctor.address?.province ?? "",
      city: doctor.address?.city ?? "",
      address: doctor.address?.address ?? "",
      postal_code: doctor.address?.postal_code ?? "",
      latitude: doctor.address?.latitude?.toString() ?? "",
      longitude: doctor.address?.longitude?.toString() ?? "",
    },
    description: doctor.description ?? "",
  };
}

export function DoctorForm({
  doctor,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: DoctorFormProps) {
  const [form, setForm] = useState<DoctorFormData>(() =>
    doctor ? doctorToForm(doctor) : emptyForm,
  );

  function update<K extends keyof DoctorFormData>(
    key: K,
    value: DoctorFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateAddress(
    key: keyof DoctorFormData["address"],
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      address: { ...current.address, [key]: value },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    onSubmit(form);
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {doctor ? "ویرایش پزشک" : "پزشک جدید"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          اطلاعات پایه پزشک، تخصص و آدرس را ثبت کنید.
        </p>
      </div>

      {error ? (
        <p role="alert" aria-live="polite" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="نام" required>
            <input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} disabled={isSubmitting} className={inputClass} />
          </Field>
          <Field label="نام خانوادگی" required>
            <input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} disabled={isSubmitting} className={inputClass} />
          </Field>
          <Field label="شماره موبایل">
            <input dir="ltr" value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} disabled={isSubmitting} className={`${inputClass} text-right`} />
          </Field>
          <Field label="نام کلینیک">
            <input value={form.clinic_name} onChange={(e) => update("clinic_name", e.target.value)} disabled={isSubmitting} className={inputClass} />
          </Field>
          <Field label="تخصص" required>
            <select value={form.specialty} onChange={(e) => update("specialty", e.target.value as DoctorSpecialty)} disabled={isSubmitting} className={inputClass}>
              {specialties.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
          <Field label="وضعیت" required>
            <select value={form.status} onChange={(e) => update("status", e.target.value as DoctorFormData["status"])} disabled={isSubmitting} className={inputClass}>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="suspended">تعلیق‌شده</option>
            </select>
          </Field>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">آدرس</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="استان"><input value={form.address.province} onChange={(e) => updateAddress("province", e.target.value)} disabled={isSubmitting} className={inputClass} /></Field>
            <Field label="شهر"><input value={form.address.city} onChange={(e) => updateAddress("city", e.target.value)} disabled={isSubmitting} className={inputClass} /></Field>
            <Field label="کد پستی"><input dir="ltr" value={form.address.postal_code} onChange={(e) => updateAddress("postal_code", e.target.value)} disabled={isSubmitting} className={`${inputClass} text-right`} /></Field>
            <Field label="آدرس"><textarea value={form.address.address} onChange={(e) => updateAddress("address", e.target.value)} disabled={isSubmitting} rows={3} className={inputClass} /></Field>
            <Field label="عرض جغرافیایی"><input dir="ltr" inputMode="decimal" value={form.address.latitude} onChange={(e) => updateAddress("latitude", e.target.value)} disabled={isSubmitting} className={`${inputClass} text-left`} /></Field>
            <Field label="طول جغرافیایی"><input dir="ltr" inputMode="decimal" value={form.address.longitude} onChange={(e) => updateAddress("longitude", e.target.value)} disabled={isSubmitting} className={`${inputClass} text-left`} /></Field>
          </div>
        </div>

        <Field label="توضیحات">
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} disabled={isSubmitting} rows={4} className={inputClass} />
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">انصراف</button>
          <button type="submit" disabled={isSubmitting || !form.first_name.trim() || !form.last_name.trim()} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "در حال ذخیره..." : doctor ? "ذخیره تغییرات" : "ثبت پزشک"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}{required ? <span className="mr-1 text-red-600">*</span> : null}
      </label>
      {children}
    </div>
  );
}
