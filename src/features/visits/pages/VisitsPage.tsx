import { sortTableRecords } from "../../../utils/date";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "../../../components/Pagination";
import { ApiError } from "../../../api/client";
import { JalaliDateInput } from "../../../components/JalaliDateInput";
import { SearchableDoctorSelect, type SearchableDoctor } from "../../../components/SearchableDoctorSelect";
import { useAuth } from "../../auth";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { formatJalaliDateTime } from "../../../utils/date";
import { VisitForm } from "../components/VisitForm";
import { SampleForm } from "../../samples/components/SampleForm";
import { getSample, getSampleProducts, updateSample } from "../../samples/services/samplesApi";
import type { Sample, SampleFormData } from "../../samples/types/sample";
import type { Product } from "../../products/types/product";
import { UnifiedVisitForm } from "../components/UnifiedVisitForm";
import {
  cancelVisit,
  completeVisit,
  createVisit,
  deleteVisit,
  getVisitDoctors,
  getVisits,
  updateVisit,
} from "../services/visitsApi";
import { getVisitStatusLabel, VISIT_STATUS_OPTIONS } from "../types/visit";
import type {
  Visit,
  VisitFormData,
  VisitListParams,
  VisitStatus,
} from "../types/visit";

export function VisitsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const isScientificVisitor = user?.roles.includes("scientific visitor") ?? false;
  const [visits, setVisits] = useState<Visit[]>([]),
    [doctorId, setDoctorId] = useState(""),
    [selectedDoctor, setSelectedDoctor] = useState<SearchableDoctor | null>(null),
    [status, setStatus] = useState<VisitStatus | "">(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [lastPage, setLastPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [actionId, setActionId] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [formError, setFormError] = useState<string | null>(null),
    [formOpen, setFormOpen] = useState(false),
    [editing, setEditing] = useState<Visit | null>(null),
    [sampleFormOpen, setSampleFormOpen] = useState(false),
    [editingSample, setEditingSample] = useState<Sample | null>(null),
    [sampleProducts, setSampleProducts] = useState<Product[]>([]),
    [actionTarget, setActionTarget] = useState<{
      visit: Visit;
      action: "complete" | "cancel";
    } | null>(null),
    [deleteTarget, setDeleteTarget] = useState<Visit | null>(null);
  useEffect(() => {
    let active = true;
    void getSampleProducts(isScientificVisitor)
      .then((items) => { if (active) setSampleProducts(items); })
      .catch((e: unknown) => { if (active) setError(e instanceof ApiError ? e.message : "خطا در دریافت محصولات نمونه."); });
    return () => { active = false; };
  }, [isScientificVisitor]);

  const load = useCallback(
    async (p?: Partial<VisitListParams>) => {
      setLoading(true);
      setError(null);
      try {
        const r = await getVisits({
          search: search.trim() || undefined,
          doctor_id: doctorId || undefined,
          status: status || undefined,
          visit_from: from || undefined,
          visit_to: to || undefined,
          sort: "-visit_date",
          page: p?.page ?? page,
          per_page: 20,
        });
        setVisits(r.data);
        setLastPage(r.meta.last_page);
        setTotal(r.meta.total);
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : "خطا در دریافت بازدیدها.");
      } finally {
        setLoading(false);
      }
    },
    [doctorId, from, page, search, status, to],
  );
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await getVisits({
          search: search.trim() || undefined,
          doctor_id: doctorId || undefined,
          status: status || undefined,
          visit_from: from || undefined,
          visit_to: to || undefined,
          sort: "-visit_date",
          page,
          per_page: 20,
        });
        if (!cancelled) {
          setVisits(r.data);
          setLastPage(r.meta.last_page);
          setTotal(r.meta.total);
        }
      } catch (e: unknown) {
        if (!cancelled)
          setError(
            e instanceof ApiError ? e.message : "خطا در دریافت بازدیدها",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [doctorId, from, page, search, status, to]);
  const reset = () => {
    setSearch("");
    setDoctorId("");
    setSelectedDoctor(null);
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  };
  async function submit(d: VisitFormData) {
    setSaving(true);
    setFormError(null);
    try {
      const saved = editing
        ? await updateVisit(editing.id, d)
        : await createVisit(d);
      setVisits((x) =>
        editing
          ? x.map((v) => (v.id === saved.id ? saved : v))
          : [saved, ...x].slice(0, 20),
      );
      if (!editing) setTotal((x) => x + 1);
      setFormOpen(false);
      setEditing(null);
    } catch (e: unknown) {
      setFormError(e instanceof ApiError ? e.message : "خطا در ذخیره بازدید.");
    } finally {
      setSaving(false);
    }
  }
  async function editSample(sampleId: string) {
    setError(null);
    setFormError(null);
    try {
      const sample = await getSample(sampleId);
      setFormOpen(false);
      setEditing(null);
      setEditingSample(sample);
      setSampleFormOpen(true);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در دریافت جزئیات نمونه.");
    }
  }
  async function submitSample(data: SampleFormData) {
    if (!editingSample) return;
    setSaving(true);
    setFormError(null);
    try {
      const saved = await updateSample(editingSample.id, { quantity: data.quantity, description: data.description });
      setVisits((current) => current.map((visit) => ({
        ...visit,
        samples: visit.samples?.map((sample) => sample.id === saved.id
          ? { ...sample, quantity: saved.quantity, product: saved.product ?? sample.product, product_name: saved.product_name ?? sample.product_name }
          : sample),
      })));
      setSampleFormOpen(false);
      setEditingSample(null);
    } catch (e: unknown) {
      setFormError(e instanceof ApiError ? e.message : "خطا در ویرایش نمونه.");
    } finally {
      setSaving(false);
    }
  }
  async function removeVisit(v: Visit) {
    if (actionId) return;
    setActionId(v.id);
    try {
      await deleteVisit(v.id);
      setVisits((x) => x.filter((i) => i.id !== v.id));
      setTotal((x) => Math.max(0, x - 1));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در حذف بازدید");
    } finally {
      setActionId(null);
    }
  }
  async function action(v: Visit, a: "complete" | "cancel") {
    if (actionId) return;
    setActionId(v.id);
    try {
      const u =
        a === "complete" ? await completeVisit(v.id) : await cancelVisit(v.id);
      setVisits((x) => x.map((i) => (i.id === u.id ? u : i)));
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "خطا در تغییر وضعیت بازدید");
    } finally {
      setActionId(null);
    }
  }
  return (
    <>
      <ConfirmModal
        open={isAdmin && deleteTarget !== null}
        title="حذف بازدید"
        description="آیا از حذف این بازدید مطمئن هستید؟"
        confirmLabel="حذف بازدید"
        variant="danger"
        isLoading={actionId !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget)
            void removeVisit(deleteTarget).finally(() => setDeleteTarget(null));
        }}
      />

      <ConfirmModal
        open={actionTarget !== null}
        title={
          actionTarget?.action === "cancel" ? "لغو بازدید" : "تکمیل بازدید"
        }
        description={
          actionTarget
            ? `آیا از ${actionTarget.action === "cancel" ? "لغو" : "تکمیل"} بازدید این پزشک مطمئن هستید؟`
            : ""
        }
        confirmLabel={
          actionTarget?.action === "cancel" ? "لغو بازدید" : "تکمیل بازدید"
        }
        variant={actionTarget?.action === "cancel" ? "danger" : "primary"}
        isLoading={actionId !== null}
        onCancel={() => setActionTarget(null)}
        onConfirm={() => {
          if (actionTarget)
            void action(actionTarget.visit, actionTarget.action).finally(() =>
              setActionTarget(null),
            );
        }}
      />

      <section className="space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-3 md:flex-row md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">بازدیدها</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-lg border px-4 py-2"
            >
              بروزرسانی
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setSampleFormOpen(false);
                setEditingSample(null);
                setFormError(null);
                setFormOpen(true);
              }}
              className="rounded-lg bg-gray-900 px-4 py-2 text-white"
            >
              بازدید جدید
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {sampleFormOpen && editingSample ? (
          <SampleForm
            visits={visits}
            products={sampleProducts}
            sample={editingSample}
            isSubmitting={saving}
            error={formError}
            onSubmit={(data) => void submitSample(data)}
            onCancel={() => { if (!saving) { setSampleFormOpen(false); setEditingSample(null); } }}
          />
        ) : null}

        {formOpen && (editing ? (
          <VisitForm
            searchDoctors={getVisitDoctors}
            visit={editing}
            isSubmitting={saving}
            error={formError}
            onSubmit={submit}
            onCancel={() => {
              if (!saving) {
                setFormOpen(false);
                setEditing(null);
              }
            }}
          />
        ) : (
          <UnifiedVisitForm
            isScientificVisitor={isScientificVisitor}
            onSaved={(saved) => {
              setVisits((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 20));
              setTotal((current) => current + 1);
              setFormOpen(false);
              setEditing(null);
              setPage(1);
              void load({ page: 1 });
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        ))}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو"
            className="rounded-lg border px-3 py-2 lg:col-span-2"
          />
          <SearchableDoctorSelect
            value={doctorId}
            selectedDoctor={selectedDoctor}
            searchDoctors={getVisitDoctors}
            onChange={(doctor) => {
              setSelectedDoctor(doctor);
              setDoctorId(doctor?.id ?? "");
              setPage(1);
            }}
            placeholder="فیلتر پزشک..."
            emptyLabel="پزشکی پیدا نشد"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as VisitStatus | "");
              setPage(1);
            }}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">همه وضعیت‌ها</option>
            {VISIT_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <JalaliDateInput
            value={from}
            onChange={(value) => {
              setFrom(value);
              setPage(1);
            }}
            className="rounded-lg border px-3 py-2"
          />
          <JalaliDateInput
            value={to}
            onChange={(value) => {
              setTo(value);
              setPage(1);
            }}
            className="rounded-lg border px-3 py-2"
          />
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>{new Intl.NumberFormat("fa-IR").format(total)} ویزیت · {new Intl.NumberFormat("fa-IR").format(visits.reduce((sum, visit) => sum + (visit.samples?.length ?? 0), 0))} نمونه در این صفحه</span>
          <button type="button" onClick={reset}>
            پاک کردن فیلترها
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "تاریخ",
                  "پزشک",
                  "محصول / نمونه",
                  "تعداد",
                  "هدف",
                  "کارمند",
                  "وضعیت",
                  "عملیات",
                ].map((x) => (
                  <th key={x} className="px-4 py-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !visits.length ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    در حال دریافت…
                  </td>
                </tr>
              ) : !visits.length ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    بازدیدی پیدا نشد.
                  </td>
                </tr>
              ) : (
                sortTableRecords(visits).flatMap((v) => {
                  const visitSamples = v.samples?.length ? v.samples : [null];
                  return visitSamples.map((sample, index) => (
                  <tr key={`${v.id}-${sample?.id ?? "no-sample"}`}>
                    {index === 0 ? <td rowSpan={visitSamples.length} className="whitespace-nowrap px-4 py-3 align-top">{formatJalaliDateTime(v.visit_date)}</td> : null}
                    {index === 0 ? <td rowSpan={visitSamples.length} className="px-4 py-3 font-medium align-top">{v.doctor_name ?? v.doctor?.name ?? "—"}</td> : null}
                    <td className="px-4 py-3 align-top">{sample ? (sample.product_name ?? sample.product?.title ?? "سمپل") : "—"}</td>
                    <td className="px-4 py-3 align-top">{sample ? new Intl.NumberFormat("fa-IR").format(sample.quantity) : "—"}</td>
                    {index === 0 ? <td rowSpan={visitSamples.length} className="px-4 py-3 align-top">{v.purpose || "—"}</td> : null}
                    {index === 0 ? <td rowSpan={visitSamples.length} className="px-4 py-3 align-top">{v.employee?.name ?? "—"}</td> : null}
                    {index === 0 ? <td rowSpan={visitSamples.length} className="px-4 py-3 align-top">{getVisitStatusLabel(v.status)}</td> : null}
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        {sample ? <button type="button" disabled={saving} onClick={() => void editSample(sample.id)} className="ui-btn-edit rounded border px-2 py-1 text-xs">ویرایش نمونه</button> : null}
                        {index === 0 && v.status === "draft" && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSampleFormOpen(false);
                                setEditingSample(null);
                                setEditing(v);
                                setFormError(null);
                                setFormOpen(true);
                              }}
                              className="ui-btn-edit rounded border px-2 py-1 text-xs"
                            >
                              ویرایش
                            </button>
                            <button
                              type="button"
                              disabled={actionId === v.id}
                              onClick={() =>
                                setActionTarget({
                                  visit: v,
                                  action: "complete",
                                })
                              }
                              className="ui-btn-edit rounded border px-2 py-1 text-xs"
                            >
                              تکمیل
                            </button>
                            <button
                              type="button"
                              disabled={actionId === v.id}
                              onClick={() =>
                                setActionTarget({ visit: v, action: "cancel" })
                              }
                              className="ui-btn-edit rounded border px-2 py-1 text-xs"
                            >
                              لغو
                            </button>
                          </>
                        )}
                        {index === 0 && isAdmin && (
                          <button
                            type="button"
                            disabled={actionId === v.id}
                            onClick={() => setDeleteTarget(v)}
                            className="ui-btn-delete rounded border px-2 py-1 text-xs"
                          >
                            حذف ویزیت
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>

        {
          <Pagination
            page={page}
            lastPage={lastPage}
            isLoading={loading}
            total={total}
            onPageChange={setPage}
          />
        }
      </section>
    </>
  );
}
