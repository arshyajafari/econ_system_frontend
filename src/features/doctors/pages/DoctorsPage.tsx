import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../../../api/client";
import { DoctorForm } from "../components/DoctorForm";
import {
  changeDoctorStatus,
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
} from "../services/doctorsApi";
import type {
  Doctor,
  DoctorFormData,
  DoctorSpecialty,
  DoctorStatus,
} from "../types/doctor";

const specialties: DoctorSpecialty[] = [
  "متخصص پوست، مو و زیبایی",
  "پزشک عمومی",
  "متخصص پوست اطفال و کودکان",
  "متخصص آلرژی و ایمنی‌شناسی",
  "متخصص ورید و عروق",
  "متخصص غدد و متابولیسم",
  "متخصص تغذیه",
];

const specialtyLabels: Record<DoctorSpecialty, string> = Object.fromEntries(
  specialties.map((item) => [item, item]),
) as Record<DoctorSpecialty, string>;

const statusLabels: Record<DoctorStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  suspended: "تعلیق‌شده",
};

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DoctorStatus | "">("");
  const [specialty, setSpecialty] = useState<DoctorSpecialty | "">("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadDoctors = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getDoctors({
        search: search.trim() || undefined,
        status: status || undefined,
        specialty: specialty || undefined,
        page,
        per_page: 20,
      });
      if (requestId !== requestIdRef.current) return;
      setDoctors(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (requestError: unknown) {
      if (requestId !== requestIdRef.current) return;
      setError(requestError instanceof ApiError && requestError.message ? requestError.message : "خطا در دریافت پزشکان.");
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [page, search, specialty, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadDoctors(); }, search.trim() ? 300 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDoctors, search]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setSpecialty("");
    setPage(1);
  }

  function openCreateForm() {
    setEditingDoctor(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(doctor: Doctor) {
    setEditingDoctor(doctor);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingDoctor(null);
    setFormError(null);
  }

  async function handleSubmit(data: DoctorFormData) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingDoctor) {
        const updated = await updateDoctor(editingDoctor.id, data);
        setDoctors((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        await createDoctor(data);
        if (page !== 1) setPage(1);
        else await loadDoctors();
      }
      setIsFormOpen(false);
      setEditingDoctor(null);
    } catch (requestError: unknown) {
      setFormError(requestError instanceof ApiError ? requestError.message : "خطا در ذخیره پزشک.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(doctor: Doctor) {
    if (pendingDeleteId) return;
    const confirmed = window.confirm(`آیا از حذف «${doctor.first_name} ${doctor.last_name}» مطمئن هستید؟`);
    if (!confirmed) return;
    const isLastItemOnPage = doctors.length === 1;
    setPendingDeleteId(doctor.id);
    setError(null);
    try {
      await deleteDoctor(doctor.id);
      setDoctors((current) => current.filter((item) => item.id !== doctor.id));
      setTotal((current) => Math.max(0, current - 1));
      if (isLastItemOnPage && page > 1) setPage((current) => Math.max(1, current - 1));
    } catch (requestError: unknown) {
      setError(requestError instanceof ApiError ? requestError.message : "خطا در حذف پزشک.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleStatusChange(doctor: Doctor, nextStatus: DoctorStatus) {
    if (doctor.status === nextStatus || pendingStatusId || pendingDeleteId === doctor.id) return;
    setPendingStatusId(doctor.id);
    setError(null);
    try {
      const updated = await changeDoctorStatus(doctor.id, nextStatus);
      if (status && updated.status !== status) {
        setDoctors((current) => current.filter((item) => item.id !== updated.id));
        setTotal((current) => Math.max(0, current - 1));
      } else {
        setDoctors((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
    } catch (requestError: unknown) {
      setError(requestError instanceof ApiError ? requestError.message : "خطا در تغییر وضعیت پزشک.");
    } finally {
      setPendingStatusId(null);
    }
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">پزشکان</h1>
          <p className="mt-1 text-sm text-gray-500">مدیریت پزشکان، تخصص‌ها و اطلاعات تماس</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { void loadDoctors(); }} disabled={isLoading} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">بروزرسانی</button>
          <button type="button" onClick={openCreateForm} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800">پزشک جدید</button>
        </div>
      </div>

      {error ? (
        <div role="alert" aria-live="polite" className="flex flex-col gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => { void loadDoctors(); }} className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto">تلاش مجدد</button>
        </div>
      ) : null}

      {isFormOpen ? <DoctorForm key={editingDoctor?.id ?? "new"} doctor={editingDoctor} isSubmitting={isSubmitting} error={formError} onSubmit={(data) => { void handleSubmit(data); }} onCancel={closeForm} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو بر اساس نام، کد، موبایل یا کلینیک" className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900" />
        <select value={specialty} onChange={(e) => { setSpecialty(e.target.value as DoctorSpecialty | ""); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
          <option value="">همه تخصص‌ها</option>
          {specialties.map((item) => <option key={item} value={item}>{specialtyLabels[item]}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as DoctorStatus | ""); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="suspended">تعلیق‌شده</option>
        </select>
        <button type="button" onClick={resetFilters} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">پاک کردن</button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Intl.NumberFormat("fa-IR").format(total)} پزشک</span>
        {isLoading && doctors.length > 0 ? <span>در حال بروزرسانی...</span> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">کد</th>
              <th className="px-4 py-3 font-medium">نام پزشک</th>
              <th className="px-4 py-3 font-medium">تخصص</th>
              <th className="px-4 py-3 font-medium">کلینیک</th>
              <th className="px-4 py-3 font-medium">موبایل</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && doctors.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">در حال دریافت پزشکان...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">پزشکی با این فیلترها پیدا نشد.</td></tr>
            ) : doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50">
                <td dir="ltr" className="whitespace-nowrap px-4 py-3 text-gray-600">{doctor.code}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                  {doctor.first_name} {doctor.last_name}{doctor.is_favorite ? <span className="mr-2" title="مورد علاقه">★</span> : null}
                </td>
                <td className="px-4 py-3 text-gray-600">{doctor.specialty}</td>
                <td className="px-4 py-3 text-gray-600">{doctor.clinic_name || "—"}</td>
                <td dir="ltr" className="whitespace-nowrap px-4 py-3 text-gray-600">{doctor.phone_number || "—"}</td>
                <td className="px-4 py-3">
                  <select value={doctor.status} disabled={pendingStatusId === doctor.id || pendingDeleteId === doctor.id} onChange={(e) => { void handleStatusChange(doctor, e.target.value as DoctorStatus); }} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs disabled:opacity-60">
                    <option value="active">{statusLabels.active}</option>
                    <option value="inactive">{statusLabels.inactive}</option>
                    <option value="suspended">{statusLabels.suspended}</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditForm(doctor)} disabled={Boolean(pendingDeleteId)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">ویرایش</button>
                    <button type="button" onClick={() => { void handleDelete(doctor); }} disabled={pendingDeleteId === doctor.id || pendingStatusId === doctor.id} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">{pendingDeleteId === doctor.id ? "در حال حذف..." : "حذف"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">قبلی</button>
          <span className="text-sm text-gray-600">صفحه {new Intl.NumberFormat("fa-IR").format(page)} از {new Intl.NumberFormat("fa-IR").format(lastPage)}</span>
          <button type="button" disabled={page >= lastPage || isLoading} onClick={() => setPage((current) => Math.min(lastPage, current + 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">بعدی</button>
        </div>
      ) : null}
    </section>
  );
}
