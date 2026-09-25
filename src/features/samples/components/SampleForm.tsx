import { useState, type FormEvent } from "react";
import { SearchableProductSelect } from "../../../components/SearchableProductSelect";
import { formatJalaliDate } from "../../../utils/date";
import type { Visit } from "../../visits/types/visit";
import type { Sample, SampleFormData, SampleProduct } from "../types/sample";

type Props={visits:Visit[];products:SampleProduct[];sample?:Sample|null;isSubmitting:boolean;error?:string|null;onSubmit:(data:SampleFormData)=>void;onCancel:()=>void};

export function SampleForm({visits,products,sample,isSubmitting,error,onSubmit,onCancel}:Props){
  const[visitId,setVisitId]=useState(sample?.visit?.id??""),[productId,setProductId]=useState(sample?.product?.id??""),[quantity,setQuantity]=useState(String(sample?.quantity??1)),[description,setDescription]=useState(sample?.description??"");
  const selectedProduct=products.find((product)=>product.id===productId);
  const maxQuantity=selectedProduct?.available_quantity;
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const value=Number(quantity);
    if(value<1 || (maxQuantity!==undefined && value>maxQuantity)) return;
    onSubmit({visit_id:sample?.visit?.id??visitId,product_id:sample?.product?.id??productId,quantity:value,description});
  }
  return <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between"><h2 className="font-semibold">{sample?"ویرایش نمونه":"ثبت نمونه جدید"}</h2><button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded border px-3 py-1 text-sm">بستن</button></div>
    {error&&<div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {!sample&&<div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1 text-sm"><span>بازدید</span><select required value={visitId} onChange={e=>setVisitId(e.target.value)} className="w-full rounded-lg border px-3 py-2"><option value="">انتخاب بازدید</option>{visits.map(visit=><option key={visit.id} value={visit.id}>{visit.doctor?.name??"پزشک نامشخص"} — {formatJalaliDate(visit.visit_date)}</option>)}</select></label>
      <label className="space-y-1 text-sm"><span>محصول</span><SearchableProductSelect value={productId} products={products} disabled={isSubmitting} onChange={(productId) => { setProductId(productId); setQuantity("1"); }} placeholder="جستجوی محصول..." /></label>
    </div>}
    {selectedProduct?.available_quantity!==undefined&&!sample?<p className="text-xs text-gray-500">موجودی قابل استفاده برای نمونه: {new Intl.NumberFormat("fa-IR").format(selectedProduct.available_quantity)} عدد</p>:null}
    <div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-sm"><span>تعداد</span><input required min={1} max={maxQuantity} type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full rounded-lg border px-3 py-2"/></label><label className="space-y-1 text-sm"><span>توضیحات</span><input value={description} onChange={e=>setDescription(e.target.value)} className="w-full rounded-lg border px-3 py-2"/></label></div>
    <div className="flex gap-2"><button type="submit" disabled={isSubmitting||(!sample&&(!visitId||!productId||Number(quantity)<1||(maxQuantity!==undefined&&Number(quantity)>maxQuantity)))} className="rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50">{isSubmitting?"در حال ذخیره…":"ذخیره"}</button><button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border px-4 py-2">انصراف</button></div>
  </form>;
}