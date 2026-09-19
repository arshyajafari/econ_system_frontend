import { FormattedNumberInput } from "../../../components/FormattedNumberInput";
import type { OrderItemFormData, OrderItemDiscountType, OrderItemOfferType, OrderProductOption } from "../types/order";

type Props = { items: OrderItemFormData[]; products: OrderProductOption[]; disabled?: boolean; onChange: (items: OrderItemFormData[]) => void };
const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 disabled:bg-gray-50";
const numberFormatter = new Intl.NumberFormat("fa-IR");

const emptyItem = (): OrderItemFormData => ({
  product_id:"", quantity:1, unit_price:"", description:"",
  discount_type:"none", discount_value:"0",
  offer_type:"none", offer_buy_quantity:"6", offer_free_quantity:"1", offer_title:"",
});

function getGross(item: OrderItemFormData) { return (Number(item.quantity)||0)*(Number(item.unit_price)||0); }
function getDiscount(item: OrderItemFormData) {
  const gross=getGross(item); const value=Number(item.discount_value)||0;
  if(item.discount_type==="percentage") return Math.min(gross,Math.round(gross*value/100*100)/100);
  if(item.discount_type==="fixed") return Math.min(gross,Math.max(0,value));
  return 0;
}
function getFree(item: OrderItemFormData) {
  if(item.offer_type!=="buy_x_get_y") return 0;
  const buy=Math.trunc(Number(item.offer_buy_quantity)||0), free=Math.trunc(Number(item.offer_free_quantity)||0);
  return buy>0 && free>0 ? Math.floor((Number(item.quantity)||0)/buy)*free : 0;
}

export function OrderItemsEditor({items,products,disabled=false,onChange}:Props) {
  const addItem=()=>onChange([...items,emptyItem()]);
  const updateItem=(index:number,patch:Partial<OrderItemFormData>)=>onChange(items.map((item,i)=>i===index?{...item,...patch}:item));
  const selectProduct=(index:number,productId:string)=>{const p=products.find(x=>x.id===productId);updateItem(index,{product_id:productId,unit_price:p?.current_price?.sale_price??p?.sale_price??""});};
  const removeItem=(index:number)=>{if(items.length>1)onChange(items.filter((_,i)=>i!==index));};
  const orderGross=items.reduce((s,i)=>s+getGross(i),0);
  const orderItemDiscount=items.reduce((s,i)=>s+getDiscount(i),0);
  const orderNet=items.reduce((s,i)=>s+getGross(i)-getDiscount(i),0);
  const freeUnits=items.reduce((s,i)=>s+getFree(i),0);

  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 bg-gradient-to-l from-gray-50 to-white px-5 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">01</span><div><h3 className="font-bold text-gray-900">اقلام سفارش</h3><p className="mt-0.5 text-xs text-gray-500">تخفیف و آفر هر محصول را جداگانه کنترل کنید.</p></div></div></div>
        <button type="button" onClick={addItem} disabled={disabled} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 disabled:opacity-50">+ افزودن محصول</button>
      </div>
    </div>
    <div className="space-y-4 p-4 md:p-5">
      {items.map((item,index)=>{
        const used=items.filter((_,i)=>i!==index).map(x=>x.product_id).filter(Boolean);
        const gross=getGross(item), discount=getDiscount(item), free=getFree(item), final=Math.max(0,gross-discount);
        return <article key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/60">
          <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">{numberFormatter.format(index+1)}</span><span className="text-sm font-bold text-gray-800">{item.product_id ? products.find(p=>p.id===item.product_id)?.title ?? "محصول" : "محصول جدید"}</span>{free>0?<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">+ {numberFormatter.format(free)} رایگان</span>:null}</div>
            <button type="button" onClick={()=>removeItem(index)} disabled={disabled||items.length===1} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-30">حذف</button>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="محصول" required><select value={item.product_id} onChange={e=>selectProduct(index,e.target.value)} disabled={disabled} className={inputClass}><option value="">انتخاب محصول</option>{products.map(p=><option key={p.id} value={p.id} disabled={used.includes(p.id)}>{p.title} — {p.code}</option>)}</select></Field>
            <Field label="تعداد خرید" required><input dir="ltr" type="number" min={1} step={1} value={item.quantity} onChange={e=>updateItem(index,{quantity:Math.max(1,Math.trunc(Number(e.target.value)||1))})} disabled={disabled} className={inputClass}/></Field>
            <Field label="قیمت واحد" required><FormattedNumberInput dir="ltr" min={0} step="0.01" value={item.unit_price} onValueChange={value=>updateItem(index,{unit_price:value})} disabled={disabled} className={inputClass}/></Field>
            <div className="rounded-xl border border-gray-200 bg-white p-3"><div className="text-[11px] font-medium text-gray-500">جمع ناخالص</div><div dir="ltr" className="mt-1 font-bold text-gray-900">{numberFormatter.format(gross)}</div></div>
          </div>

          <div className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-900"/><h4 className="text-sm font-bold text-gray-900">تخفیف اختصاصی این محصول</h4></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="نوع تخفیف"><select value={item.discount_type} onChange={e=>updateItem(index,{discount_type:e.target.value as OrderItemDiscountType})} disabled={disabled} className={inputClass}><option value="none">بدون تخفیف</option><option value="percentage">درصدی</option><option value="fixed">مبلغ ثابت</option></select></Field>
              <Field label={item.discount_type==="percentage"?"درصد تخفیف":"مبلغ تخفیف"}><FormattedNumberInput dir="ltr" min={0} max={item.discount_type==="percentage"?100:undefined} step="0.01" value={item.discount_value} onValueChange={value=>updateItem(index,{discount_value:value})} disabled={disabled||item.discount_type==="none"} className={inputClass}/></Field>
              <div className="rounded-xl bg-gray-50 px-4 py-3"><div className="text-[11px] text-gray-500">تخفیف محاسبه‌شده</div><div dir="ltr" className="mt-1 font-bold text-gray-900">{numberFormatter.format(discount)}</div></div>
            </div>
          </div>

          <div className="mx-4 mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">OFFER</span><h4 className="text-sm font-bold text-gray-900">آفر این محصول</h4></div><p className="mt-1 text-xs text-gray-500">مثال: ۶ عدد بخر، ۱ عدد رایگان بگیر</p></div>{free>0?<div className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm">قابل تحویل: {numberFormatter.format(Number(item.quantity)+free)} عدد</div>:null}</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Field label="نوع آفر"><select value={item.offer_type} onChange={e=>updateItem(index,{offer_type:e.target.value as OrderItemOfferType})} disabled={disabled} className={inputClass}><option value="none">بدون آفر</option><option value="buy_x_get_y">خرید X، هدیه Y</option></select></Field>
              {item.offer_type==="buy_x_get_y"?<>
                <Field label="هر چند خرید؟"><input dir="ltr" type="number" min={1} step={1} value={item.offer_buy_quantity} onChange={e=>updateItem(index,{offer_buy_quantity:e.target.value})} disabled={disabled} className={inputClass}/></Field>
                <Field label="چند عدد رایگان؟"><input dir="ltr" type="number" min={1} step={1} value={item.offer_free_quantity} onChange={e=>updateItem(index,{offer_free_quantity:e.target.value})} disabled={disabled} className={inputClass}/></Field>
                <Field label="عنوان آفر"><input value={item.offer_title} onChange={e=>updateItem(index,{offer_title:e.target.value})} disabled={disabled} className={inputClass} placeholder="مثلاً آفر ۶+۱"/></Field>
              </>:null}
            </div>
            {item.offer_type==="buy_x_get_y"?<div className="mt-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm"><strong className="text-emerald-700">{numberFormatter.format(item.quantity)} عدد خرید</strong><span className="mx-2 text-gray-400">→</span><strong className="text-emerald-700">{numberFormatter.format(free)} عدد رایگان</strong><span className="mx-2 text-gray-300">•</span><span className="text-gray-600">جمع تحویلی: {numberFormatter.format(Number(item.quantity)+free)} عدد</span></div>:null}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-white p-4 sm:grid-cols-3">
            <Metric label="مبلغ بعد از تخفیف" value={final}/><Metric label="تعداد رایگان" value={free}/><Metric label="تعداد تحویلی" value={Number(item.quantity)+free} emphasized/>
          </div>
          <div className="border-t border-gray-100 bg-white px-4 pb-4"><Field label="توضیحات آیتم"><input value={item.description} onChange={e=>updateItem(index,{description:e.target.value})} disabled={disabled} className={inputClass}/></Field></div>
        </article>
      })}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="جمع ناخالص اقلام" value={orderGross}/><Metric label="تخفیف اقلام" value={orderItemDiscount}/><Metric label="رایگان کل" value={freeUnits}/><Metric label="جمع اقلام پس از تخفیف" value={orderNet} emphasized/>
      </div>
    </div>
  </section>;
}
function Metric({label,value,emphasized=false}:{label:string;value:number;emphasized?:boolean}){return <div className={`rounded-2xl border border-gray-200 bg-white px-4 py-3 ${emphasized?"ring-1 ring-gray-300":""}`}><div className="text-[11px] text-gray-500">{label}</div><div dir="ltr" className="mt-1 text-sm font-bold text-gray-900">{numberFormatter.format(value)}</div></div>}
function Field({label,required=false,children}:{label:string;required?:boolean;children:React.ReactNode}){return <div><label className="mb-2 block text-xs font-semibold text-gray-600">{label}{required?<span className="mr-1 text-red-600">*</span>:null}</label>{children}</div>}
