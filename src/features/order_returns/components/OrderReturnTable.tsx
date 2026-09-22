import { useNavigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../../auth";
import { ApiError } from "../../../api/client";
import { formatJalaliDateTime } from "../../../utils/date";
import { receiveOrderReturn } from "../services/orderReturnsApi";
import type { OrderReturn } from "../types/orderReturn";

type Props = { orderReturns: OrderReturn[]; isLoading?: boolean; onUpdated?: (item: OrderReturn) => void };
const numberFormatter = new Intl.NumberFormat("fa-IR");
function formatNumber(value: number): string { return numberFormatter.format(value); }
function getStatusLabel(status: OrderReturn["status"]): string { switch(status){case "draft":return "پیش‌نویس";case "pending":return "در انتظار تأیید";case "confirmed":return "تأیید شده";case "completed":return "تکمیل شده";case "cancelled":return "لغو شده";} }
function getStatusClass(status: OrderReturn["status"]): string { switch(status){case "draft":return "bg-gray-100 text-gray-700";case "pending":return "bg-yellow-100 text-yellow-700";case "confirmed":return "bg-blue-100 text-blue-700";case "completed":return "bg-green-100 text-green-700";case "cancelled":return "bg-red-100 text-red-700";} }
function getReturnTotal(orderReturn: OrderReturn): number { return Number(orderReturn.return_amount || 0); }

export function OrderReturnTable({ orderReturns, isLoading=false, onUpdated }: Props) {
  const navigate=useNavigate();
  const { user } = useAuth();
  const isDeliveryOperator = user?.roles.includes("delivery operator") ?? false;
  const isAdmin = user?.roles.includes("admin") ?? false;
  const canReceiveReturn = isAdmin || isDeliveryOperator;
  const [receivingId, setReceivingId] = React.useState<string | null>(null);
  if(isLoading)return <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">در حال دریافت مرجوعی‌ها...</div>;
  if(orderReturns.length===0)return <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">هنوز مرجوعی‌ای ثبت نشده است.</div>;
  return <div className="overflow-hidden rounded-xl border border-gray-200 bg-white"><div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead className="bg-gray-50 text-right text-gray-600"><tr>{["کد مرجوعی","سفارش","مشتری","تعداد اقلام","مبلغ","وضعیت","ثبت تحویل","تاریخ","عملیات"].map(x=><th key={x} className="px-5 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{orderReturns.map(orderReturn=><tr key={orderReturn.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-medium text-gray-900 cursor-pointer" onClick={()=>navigate(`/order-returns/${orderReturn.id}`)}>{orderReturn.code}</td><td className="px-5 py-4 text-gray-700">{orderReturn.order?.code??"—"}</td><td className="px-5 py-4 text-gray-700">{orderReturn.customer?.name??"—"}</td><td className="px-5 py-4">{formatNumber(orderReturn.items.reduce((sum,item)=>sum+Number(item.quantity||0),0))}</td><td dir="ltr" className="px-5 py-4 font-medium text-gray-900">{formatNumber(getReturnTotal(orderReturn))}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(orderReturn.status)}`}>{getStatusLabel(orderReturn.status)}</span></td><td className="px-5 py-4">{orderReturn.delivered_at ? <div className="text-xs font-medium text-green-700">تحویل گرفته شد<div className="mt-1 text-gray-500">{formatJalaliDateTime(orderReturn.delivered_at)}</div></div> : <span className="text-xs text-gray-400">تحویل نشده</span>}</td><td className="px-5 py-4 text-gray-500">{formatJalaliDateTime(orderReturn.created_at)}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" className="rounded border px-2 py-1 text-xs" onClick={()=>navigate(`/order-returns/${orderReturn.id}`)}>مشاهده</button>{canReceiveReturn && !orderReturn.delivered_at && orderReturn.status !== "cancelled" ? <button type="button" disabled={receivingId===orderReturn.id} className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700" onClick={async()=>{setReceivingId(orderReturn.id);try{const updated=await receiveOrderReturn(orderReturn.id);onUpdated?.(updated);}catch(e:unknown){window.alert(e instanceof ApiError ? e.message : "ثبت تحویل مرجوعی ناموفق بود.");}finally{setReceivingId(null);}}}>{receivingId===orderReturn.id?"در حال ثبت...":"تحویل"}</button>:null}</div></td></tr>)}</tbody></table></div></div>;
}
