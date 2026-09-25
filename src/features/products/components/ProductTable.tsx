import type { Product, ProductStatus } from "../types/product";
import { PRODUCT_STATUS_OPTIONS } from "../types/product";

type ProductTableProps = {
  products: Product[];
  isLoading: boolean;
  pendingStatusId: string | null;
  pendingDeleteId: string | null;
  isAdmin: boolean;
  canEdit: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStatusChange: (product: Product, status: ProductStatus) => void;
};

const statusLabels: Record<ProductStatus, string> = { active: "فعال", inactive: "غیرفعال", pending: "در انتظار", discontinued: "تولید متوقف شده" };
const money = new Intl.NumberFormat("fa-IR");

export function ProductTable({ products, isLoading, pendingStatusId, pendingDeleteId, isAdmin, canEdit, onEdit, onDelete, onStatusChange }: ProductTableProps) {
  if (isLoading && products.length === 0) return <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white"><p className="text-sm text-gray-500">در حال دریافت محصولات...</p></div>;
  if (products.length === 0) return <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center"><p className="text-sm text-gray-500">محصولی برای نمایش وجود ندارد.</p></div>;
  return <div className="overflow-hidden rounded-xl border border-gray-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-right text-sm"><thead className="border-b border-gray-200 bg-gray-50"><tr>{["کد","محصول","برند","دسته‌بندی","قیمت فروش","بارکد","وضعیت","عملیات"].map(title=><th key={title} className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">{title}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{products.map(product=>{const isStatusPending=pendingStatusId===product.id;const isDeletePending=pendingDeleteId===product.id;const salePrice=product.current_price?.sale_price;return <tr key={product.id} className="hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{product.code}</td><td className="min-w-52 px-4 py-3 text-gray-900">{product.title}</td><td className="whitespace-nowrap px-4 py-3 text-gray-600">{product.brand?.title??"-"}</td><td className="whitespace-nowrap px-4 py-3 text-gray-600">{product.category?.title??"-"}</td><td className="whitespace-nowrap px-4 py-3 text-gray-700">{salePrice===undefined?"-":money.format(Number(salePrice))}</td><td dir="ltr" className="whitespace-nowrap px-4 py-3 text-right text-gray-600">{product.barcode??"-"}</td><td className="whitespace-nowrap px-4 py-3">{isAdmin ? <select aria-label={`تغییر وضعیت ${product.title}`} value={product.status} disabled={isStatusPending||isDeletePending} onChange={event=>onStatusChange(product,event.target.value as ProductStatus)} className="rounded-full border-0 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 outline-none disabled:cursor-not-allowed disabled:opacity-60">{PRODUCT_STATUS_OPTIONS.map(option=><option key={option.value} value={option.value}>{statusLabels[option.value]}</option>)}</select> : <span className="text-xs text-gray-500">{statusLabels[product.status]}</span>}{isStatusPending?<span className="mr-2 text-xs text-gray-400">در حال ذخیره...</span>:null}</td><td className="whitespace-nowrap px-4 py-3">{canEdit ? <div className="flex flex-wrap items-center gap-1.5"><button type="button" onClick={()=>onEdit(product)} disabled={isDeletePending||isStatusPending} className="ui-btn-edit rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50">ویرایش</button>{isAdmin ? <button type="button" onClick={()=>onDelete(product)} disabled={isDeletePending||isStatusPending} className="ui-btn-delete rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50">{isDeletePending?"در حال حذف...":"حذف"}</button> : null}</div> : <span className="text-xs text-gray-400">فقط مشاهده</span>}</td></tr>})}</tbody></table></div></div>;
}
