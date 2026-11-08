import { Button } from "../../../design-system/components/Button";
import type { Brand } from "../types/catalog";

type Props = {
  brands: Brand[];
  loading: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  onEdit: (brand: Brand) => void;
  onToggleActive: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
};

export function BrandCatalogList({ brands, loading, canEdit, isAdmin, onEdit, onToggleActive, onDelete }: Props) {
  return (
    <div className="divide-y border-t border-gray-100">
      {loading ? <p className="p-6 text-center text-sm text-gray-500">در حال دریافت…</p> : brands.length === 0 ? <p className="p-6 text-center text-sm text-gray-500">برندی پیدا نشد.</p> : brands.map((brand) => (
        <div key={brand.id} className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50/70">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 text-xs text-gray-400">
              {brand.logo ? <img src={brand.logo} alt="" className="h-full w-full object-contain" /> : "—"}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">{brand.title}</div>
              <div className="mt-1 text-xs text-gray-500">{brand.code} · {brand.is_active ? "فعال" : "غیرفعال"}</div>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="edit" size="sm" type="button" onClick={() => { if (canEdit) onEdit(brand); }} className="ui-btn-edit rounded-lg border px-2.5 py-1.5 text-xs font-medium">ویرایش</Button>
            {isAdmin ? <Button variant="warning" size="sm" type="button" onClick={() => onToggleActive(brand)} className="ui-btn-disable rounded-lg border px-2.5 py-1.5 text-xs font-medium">{brand.is_active ? "غیرفعال" : "فعال"}</Button> : null}
            {isAdmin ? <Button variant="danger" size="sm" type="button" onClick={() => onDelete(brand)} className="ui-btn-delete rounded-lg border px-2.5 py-1.5 text-xs font-medium">حذف</Button> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
