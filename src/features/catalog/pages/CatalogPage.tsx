import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { ApiError } from "../../../api/client";
import { ImageUploadField } from "../../../components/ImageUploadField";
import { ConfirmModal } from "../../../components/ConfirmModal";
import {
  changeBrandActivity,
  changeCategoryActivity,
  createBrand,
  createCategory,
  deleteBrand,
  deleteCategory,
  getBrands,
  getCategories,
  updateBrand,
  updateCategory,
} from "../services/catalogApi";
import type {
  Brand,
  BrandFormData,
  CategoryFormData,
  ProductCategory,
} from "../types/catalog";

const emptyBrand: BrandFormData = {
  title: "",
  logo: "",
  sort_order: 0,
  is_active: true,
  description: "",
  logo_file: null,
};
const emptyCategory: CategoryFormData = {
  title: "",
  parent_id: "",
  sort_order: 0,
  is_active: true,
  description: "",
};
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1.5 block text-xs font-medium text-gray-600";

export function CatalogPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;
  const canEdit = isAdmin || (user?.roles.includes("accountant") ?? false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [brandForm, setBrandForm] = useState<BrandFormData>(emptyBrand);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormData>(emptyCategory);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "brand" | "category";
    id: string;
    title: string;
  } | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c] = await Promise.all([
        getBrands({ per_page: 100 }),
        getCategories({ per_page: 100 }),
      ]);
      setBrands(b.data);
      setCategories(c.data);
    } catch (e: unknown) {
      setError(
        e instanceof ApiError
          ? e.message
          : "خطا در دریافت برندها و دسته‌بندی‌ها.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const filteredBrands = brands.filter((b) =>
    `${b.title} ${b.code}`
      .toLocaleLowerCase()
      .includes(brandSearch.trim().toLocaleLowerCase()),
  );
  const filteredCategories = categories.filter((c) =>
    `${c.title} ${c.code}`
      .toLocaleLowerCase()
      .includes(categorySearch.trim().toLocaleLowerCase()),
  );
  const parentOptions = categories.filter((c) => c.id !== editingCategory);
  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!brandForm.title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (editingBrand) await updateBrand(editingBrand, brandForm);
      else await createBrand(brandForm);
      setBrandForm(emptyBrand);
      setEditingBrand(null);
      await load();
    } catch (x: unknown) {
      setError(x instanceof ApiError ? x.message : "خطا در ذخیره برند.");
    } finally {
      setSaving(false);
    }
  }
  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (editingCategory) await updateCategory(editingCategory, categoryForm);
      else await createCategory(categoryForm);
      setCategoryForm(emptyCategory);
      setEditingCategory(null);
      await load();
    } catch (x: unknown) {
      setError(x instanceof ApiError ? x.message : "خطا در ذخیره دسته‌بندی.");
    } finally {
      setSaving(false);
    }
  }
  async function removeBrand(b: Brand) {
    setDeleteTarget({ type: "brand", id: b.id, title: b.title });
  }
  async function removeCategory(c: ProductCategory) {
    setDeleteTarget({ type: "category", id: c.id, title: c.title });
  }
  const cancelBrandEdit = () => {
    setEditingBrand(null);
    setBrandForm(emptyBrand);
  };
  const cancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "brand") await deleteBrand(deleteTarget.id);
      else await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (x: unknown) {
      setError(x instanceof ApiError ? x.message : "خطا در حذف مورد.");
    }
  }

  return (
    <>
      <ConfirmModal
        open={deleteTarget !== null}
        title={deleteTarget?.type === "brand" ? "حذف برند" : "حذف دسته‌بندی"}
        description={
          deleteTarget ? `آیا از حذف «${deleteTarget.title}» مطمئن هستید؟` : ""
        }
        confirmLabel="حذف"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
      <section className="space-y-6 p-4 md:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-900" />
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                برندها و دسته‌بندی‌ها
              </h1>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            بروزرسانی
          </button>
        </header>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">برندها</h2>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
                  {filteredBrands.length} مورد
                </span>
              </div>
            </div>
            <form onSubmit={saveBrand} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>نام برند</label>
                  <input
                    required
                    disabled={saving || !canEdit}
                    value={brandForm.title}
                    onChange={(e) =>
                      setBrandForm({ ...brandForm, title: e.target.value })
                    }
                    placeholder="مثلاً سالوویتو"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>ترتیب نمایش</label>
                  <input
                    min={0}
                    type="number"
                    disabled={saving || !canEdit}
                    value={brandForm.sort_order}
                    onChange={(e) =>
                      setBrandForm({
                        ...brandForm,
                        sort_order: Math.max(0, Number(e.target.value)),
                      })
                    }
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
              <ImageUploadField
                label="لوگوی برند"
                value={brandForm.logo}
                file={brandForm.logo_file}
                disabled={saving}
                onFileChange={(file) =>
                  setBrandForm({ ...brandForm, logo_file: file })
                }
              />
              <div>
                <label className={labelClass}>توضیحات</label>
                <textarea
                  disabled={saving || !canEdit}
                  value={brandForm.description}
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, description: e.target.value })
                  }
                  placeholder="توضیحات کوتاه درباره برند..."
                  rows={1}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <label className="w-full flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    وضعیت برند
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    برند فعال در کاتالوگ نمایش داده می‌شود.
                  </span>
                </span>
                <input
                  type="checkbox"
                  disabled={saving || !canEdit}
                  checked={brandForm.is_active}
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
              <div className="w-full flex flex-wrap gap-2 pt-4">
                <button
                  disabled={saving || !canEdit}
                  className="w-full rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {editingBrand ? "ذخیره تغییرات" : "افزودن برند"}
                </button>
                {editingBrand && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={cancelBrandEdit}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
            <div className="border-t border-gray-100 p-5">
              <label className="sr-only">جستجوی برند</label>
              <input
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="جستجوی برند..."
                className={inputClass}
              />
            </div>
            <div className="divide-y border-t border-gray-100">
              {loading ? (
                <p className="p-6 text-center text-sm text-gray-500">
                  در حال دریافت…
                </p>
              ) : filteredBrands.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">
                  برندی پیدا نشد.
                </p>
              ) : (
                filteredBrands.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 text-xs text-gray-400">
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          "—"
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {b.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {b.code} · {b.is_active ? "فعال" : "غیرفعال"}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!canEdit) return;
                          setEditingBrand(b.id);
                          setBrandForm({
                            title: b.title,
                            logo: b.logo ?? "",
                            logo_file: null,
                            sort_order: b.sort_order,
                            is_active: b.is_active,
                            description: b.description ?? "",
                          });
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ویرایش
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() =>
                            void changeBrandActivity(b.id, !b.is_active)
                              .then(load)
                              .catch((x: unknown) =>
                                setError(
                                  x instanceof ApiError
                                    ? x.message
                                    : "خطا در تغییر وضعیت برند.",
                                ),
                              )
                          }
                          className="rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-gray-50"
                          disabled={!isAdmin}
                        >
                          {b.is_active ? "غیرفعال" : "فعال"}
                        </button>
                      ) : null}
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => void removeBrand(b)}
                          className="rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          حذف
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">دسته‌بندی محصولات</h2>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
                  {filteredCategories.length} مورد
                </span>
              </div>
            </div>
            <form onSubmit={saveCategory} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>نام دسته‌بندی</label>
                  <input
                    required
                    disabled={saving || !canEdit}
                    value={categoryForm.title}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="نام دسته‌بندی"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>دسته والد</label>
                  <select
                    disabled={saving || !canEdit}
                    value={categoryForm.parent_id}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        parent_id: e.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">بدون والد</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>ترتیب نمایش</label>
                  <input
                    min={0}
                    type="number"
                    disabled={saving || !canEdit}
                    value={categoryForm.sort_order}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        sort_order: Math.max(0, Number(e.target.value)),
                      })
                    }
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>وضعیت</label>
                  <div className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-800">
                      فعال
                    </span>
                    <input
                      type="checkbox"
                      disabled={saving || !canEdit}
                      checked={categoryForm.is_active}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>توضیحات</label>
                <textarea
                  disabled={saving || !canEdit}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="توضیحات..."
                  rows={1}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="w-full flex flex-wrap gap-2 border-gray-100 pt-4">
                <button
                  disabled={saving || !canEdit}
                  className="w-full rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {editingCategory ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={cancelCategoryEdit}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
            <div className="border-t border-gray-100 p-5">
              <input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="جستجوی دسته‌بندی..."
                className={inputClass}
              />
            </div>
            <div className="divide-y border-t border-gray-100">
              {loading ? (
                <p className="p-6 text-center text-sm text-gray-500">
                  در حال دریافت…
                </p>
              ) : filteredCategories.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">
                  دسته‌بندی‌ای پیدا نشد.
                </p>
              ) : (
                filteredCategories.map((c) => {
                  const parent = categories.find((p) => p.id === c.parent_id);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50/70"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {c.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {c.code}
                          {parent
                            ? ` · والد: ${parent.title}`
                            : " · ریشه"} · {c.is_active ? "فعال" : "غیرفعال"}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!canEdit) return;
                            setEditingCategory(c.id);
                            setCategoryForm({
                              title: c.title,
                              parent_id: c.parent_id ?? "",
                              sort_order: c.sort_order,
                              is_active: c.is_active,
                              description: c.description ?? "",
                            });
                          }}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          ویرایش
                        </button>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() =>
                              void changeCategoryActivity(c.id, !c.is_active)
                                .then(load)
                                .catch((x: unknown) =>
                                  setError(
                                    x instanceof ApiError
                                      ? x.message
                                      : "خطا در تغییر وضعیت دسته‌بندی.",
                                  ),
                                )
                            }
                            className="rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-gray-50"
                            disabled={!isAdmin}
                          >
                            {c.is_active ? "غیرفعال" : "فعال"}
                          </button>
                        ) : null}
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => void removeCategory(c)}
                            className="rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            حذف
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
