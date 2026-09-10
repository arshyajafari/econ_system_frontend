import { apiClient } from "../../../api/client";
import type { InventoryListResponse,ReceiveInventoryData } from "../types/inventory";
export async function getInventory(params:{search?:string;product_id?:string;expired?:boolean;sort?:string;per_page?:number}={}){const r=await apiClient.get<InventoryListResponse>("/inventory-batches",{params});return r.data}
export async function receiveInventory(data:ReceiveInventoryData){const r=await apiClient.post("/inventory-batches",{product_id:data.product_id,batch_number:data.batch_number||undefined,expire_date:data.expire_date||undefined,quantity:data.quantity,received_at:data.received_at||undefined,description:data.description.trim()||undefined});return r.data}
export async function deleteInventoryBatch(id:string){await apiClient.delete(`/inventory-batches/${id}`)}
