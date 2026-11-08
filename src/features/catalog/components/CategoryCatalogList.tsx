import { Button } from "../../../design-system/components/Button";
import type { ProductCategory } from "../types/catalog";

type Props = {
  categories: ProductCategory[];
  allCategories: ProductCategory[];
  loading: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  onEdit: (category: ProductCategory) => void;
  onToggleActive: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
};

export function CategoryCatalogList({ categories, allCategories, loading, canEdit, isAdmin, onEdit, onToggleActive, onDelete }: Props) {
  return (
    <div className="divide-y border-t border-gray-100">
      {loading ? <p className="p-6 text-center text-sm text-gray-500">در حال دریافت…</p> : categories.length === 0 ? <p className="p-6 text-center text-sm text-gray-500">دسته‌بندی‌ای پیدا نشد.</p> : categories.map((category) => {
        const parent = allCategories.find((item) => item.id === category.parent_id);
        return (
          <div key={category.id} className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50/70">
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">{category.title}</div>
              <div className="mt-1 text-xs text-gray-500">{category.code}{parent ? ` · والد: ${parent.title}` : " · ریشه"} · {category.is_active ? "فعال" : "غیرفعال"}</div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button variant="edit" size="sm" type="button" onClick={() => { if (canEdit) onEdit(category); }} className="ui-btn-edit rounded-lg border px-2.5 py-1.5 text-xs font-medium">ویرایش</Button>
              {isAdmin ? <Button variant="warning" size="sm" type="button" onClick={() => onToggleActive(category)} className="ui-btn-disable rounded-lg border px-2.5 py-1.5 text-xs font-medium"> {category.is_active ? "غیرفعال" : "فعال"}</Button> : null}
              {isAdmin ? <Button variant="danger" size="sm" type="button" onClick={() => onDelete(category)} className="ui-btn-delete rounded-lg border px-2.5 py-1.5 text-xs font-medium">حذف</Button> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
