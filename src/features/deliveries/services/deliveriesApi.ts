import { apiClient } from "../../../api/client";
import type { OrderListResponse } from "../../orders/types/order";
import type { Delivery, DeliveryFormData, DeliveryListParams, DeliveryListResponse } from "../types/delivery";
export async function getDeliveries(params:DeliveryListParams={}){const r=await apiClient.get<DeliveryListResponse>("/deliveries",{params});return r.data}
export async function getDelivery(id:string){const r=await apiClient.get<Delivery>(`/deliveries/${id}`);return r.data}
export async function createDelivery(d:DeliveryFormData){const r=await apiClient.post<Delivery>("/deliveries",{...d,recipient_name:d.recipient_name.trim(),recipient_phone:d.recipient_phone.trim(),address:d.address.trim(),description:d.description.trim()||undefined});return r.data}
export async function updateDelivery(id:string,d:Omit<DeliveryFormData,"order_id">){const r=await apiClient.put<Delivery>(`/deliveries/${id}`,{...d,recipient_name:d.recipient_name.trim(),recipient_phone:d.recipient_phone.trim(),address:d.address.trim(),description:d.description.trim()||undefined});return r.data}
export async function prepareDelivery(id:string){const r=await apiClient.post<Delivery>(`/deliveries/${id}/prepare`);return r.data}
export async function shipDelivery(id:string){const r=await apiClient.post<Delivery>(`/deliveries/${id}/ship`);return r.data}
export async function completeDelivery(id:string){const r=await apiClient.post<Delivery>(`/deliveries/${id}/complete`);return r.data}
export async function cancelDelivery(id:string){const r=await apiClient.post<Delivery>(`/deliveries/${id}/cancel`);return r.data}
export async function getCompletedOrders(){const r=await apiClient.get<OrderListResponse>("/orders",{params:{status:"completed",per_page:500}});return r.data.data}
