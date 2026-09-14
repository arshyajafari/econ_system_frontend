import type { FormEvent } from "react";
import { useState } from "react";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import type { Doctor } from "../../doctors/types/doctor";
import type { Visit, VisitFormData } from "../types/visit";

export function VisitForm({ doctors, visit, isSubmitting, error, onSubmit, onCancel }: { doctors: Doctor[]; visit: Visit | null; isSubmitting: boolean; error: string | null; onSubmit: (data: VisitFormData) => void; onCancel: () => void }) {
  const initialDateTime = visit?.visit_date?.slice(0, 16) ?? "";
  const [doctorId, setDoctorId] = useState(visit?.doctor?.id ?? "");
  const [date, setDate] = useState(initialDateTime.slice(0, 10));
  const [time, setTime] = useState(initialDateTime.slice(11, 16));
  const [purpose, setPurpose] = useState(visit?.purpose ?? "");
  const [description, setDescription] = useState(visit?.description ?? "");

  function submit(e: FormEvent) { e.preventDefault(); if (doctorId && date && time && purpose.trim()) onSubmit({ doctor_id: doctorId, visit_date: `${date}T${time}`, purpose, description }); }
  return <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-4"><div className="grid gap-3 md:grid-cols-2"><select required disabled={Boolean(visit) || isSubmitting} value={doctorId} onChange={e => setDoctorId(e.target.value)} className="rounded-lg border px-3 py-2.5"><option value="">انتخاب پزشک</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}</select><div className="grid grid-cols-2 gap-2"><JalaliDateInput value={date} onChange={setDate} disabled={isSubmitting} required className="rounded-lg border px-3 py-2.5" /><input required disabled={isSubmitting} type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-lg border px-3 py-2.5" aria-label="ساعت بازدید" /></div><input required disabled={isSubmitting} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="هدف بازدید" className="rounded-lg border px-3 py-2.5 md:col-span-2" /><textarea disabled={isSubmitting} value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات" rows={3} className="rounded-lg border px-3 py-2.5 md:col-span-2" /></div>{error && <div role="alert" className="text-sm text-red-600">{error}</div>}<div className="flex gap-2"><button disabled={isSubmitting} className="rounded-lg bg-gray-900 px-4 py-2 text-white">{isSubmitting ? "در حال ذخیره…" : visit ? "ذخیره تغییرات" : "ثبت بازدید"}</button><button type="button" disabled={isSubmitting} onClick={onCancel} className="rounded-lg border px-4 py-2">انصراف</button></div></form>;
}