export type InventoryProduct={id:string;code:string;title:string};
export type InventoryBatch={id:string;product:InventoryProduct|null;batch_number:string|null;expire_date:string|null;received_at:string|null;quantity:number;reserved_quantity:number;available_quantity:number;is_expired:boolean;is_near_expire:boolean;description:string|null;created_at:string|null;updated_at:string|null};
export type InventoryListResponse={data:InventoryBatch[];meta?:{current_page:number;last_page:number;total:number;per_page:number};links?:Record<string,string|null>};
export type ReceiveInventoryData={product_id:string;batch_number:string;expire_date:string;quantity:number;received_at:string;description:string};
