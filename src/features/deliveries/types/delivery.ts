export type DeliveryStatus = "pending" | "preparing" | "shipped" | "delivered" | "cancelled";
export type DeliveryParty = { id: string; code: string; name: string };
export type DeliveryOrder = { id: string; code: string; status: string };
export type Delivery = { id:string; order:DeliveryOrder|null; customer:DeliveryParty|null; employee:DeliveryParty|null; status:DeliveryStatus; prepared_at:string|null; shipped_at:string|null; delivered_at:string|null; cancelled_at:string|null; recipient_name:string; recipient_phone:string; address:string; description:string|null; created_at:string|null; updated_at:string|null };
export type DeliveryFormData={order_id:string;recipient_name:string;recipient_phone:string;address:string;description:string};
export type DeliveryListParams={search?:string;order_id?:string;customer_id?:string;employee_id?:string;status?:DeliveryStatus;sort?:string;page?:number;per_page?:number};
export type DeliveryListResponse={data:Delivery[];meta:{current_page:number;last_page:number;total:number;per_page:number};links?:Record<string,string|null>};
export const DELIVERY_STATUS_OPTIONS:{value:DeliveryStatus;label:string}[]=[{value:"pending",label:"در انتظار"},{value:"preparing",label:"در حال آماده‌سازی"},{value:"shipped",label:"ارسال‌شده"},{value:"delivered",label:"تحویل‌شده"},{value:"cancelled",label:"لغوشده"}];
export const getDeliveryStatusLabel=(s:DeliveryStatus)=>DELIVERY_STATUS_OPTIONS.find(x=>x.value===s)?.label??s;
