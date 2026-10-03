import type { FormEvent } from "react";
import { useState } from "react";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { SearchableDoctorSelect, type SearchableDoctor } from "../../../components/SearchableDoctorSelect";
import type { Visit, VisitFormData } from "../types/visit";

export function VisitForm({
  searchDoctors,
  visit,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: {
  searchDoctors: (query: string) => Promise<SearchableDoctor[]>;
  visit: Visit | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (data: VisitFormData) => void;
  onCancel: () => void;
}) {
  const initialDateTime = visit?.visit_date?.slice(0, 16) ?? "";
  const [doctorId, setDoctorId] = useState(visit?.doctor?.id ?? "");
  const [date, setDate] = useState(initialDateTime.slice(0, 10));
  const [time, setTime] = useState(initialDateTime.slice(11, 16));
  const [purpose, setPurpose] = useState(visit?.purpose ?? "");
  const [description, setDescription] = useState(visit?.description ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (doctorId && date && time && purpose.trim())
      onSubmit({
        doctor_id: doctorId,
        visit_date: `${date}T${time}`,
        purpose,
        description,
      });
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border bg-white p-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <SearchableDoctorSelect
          value={doctorId}
          selectedDoctor={visit?.doctor ? { id: visit.doctor.id, first_name: visit.doctor.name, last_name: "", specialty: visit.doctor.specialty, clinic_name: visit.doctor.clinic_name } : null}
          disabled={Boolean(visit) || isSubmitting}
          searchDoctors={searchDoctors}
          onChange={(doctor) => setDoctorId(doctor?.id ?? "")}
          placeholder="جستجوی پزشک..."
          emptyLabel="پزشکی پیدا نشد"
        />
        <div className="grid grid-cols-2 gap-2">
          <JalaliDateInput
            value={date}
            onChange={setDate}
            disabled={isSubmitting}
            required
            className="rounded-lg border px-3 py-2.5"
          />
          <input
            required
            disabled={isSubmitting}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border px-3 py-2.5"
            aria-label="ساعت بازدید"
          />
        </div>
        <input
          required
          disabled={isSubmitting}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="هدف بازدید"
          className="rounded-lg border px-3 py-2.5 md:col-span-2"
        />
        <textarea
          disabled={isSubmitting}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="توضیحات"
          rows={3}
          className="rounded-lg border px-3 py-2.5 md:col-span-2"
        />
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          disabled={isSubmitting}
          className="rounded-lg bg-gray-900 px-4 py-2 text-white"
        >
          {isSubmitting
            ? "در حال ذخیره…"
            : visit
              ? "ذخیره تغییرات"
              : "ثبت بازدید"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="rounded-lg border px-4 py-2"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
