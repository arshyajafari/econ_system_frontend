export type ScientificInventoryProduct={id:string;code:string;title:string;sale_price:string|null};
export type ScientificInventoryEmployee={id:string;code:string;name:string};
export type ScientificInventoryItem={id:string;employee:ScientificInventoryEmployee|null;product:ScientificInventoryProduct|null;received_quantity:number;used_quantity:number;available_quantity:number;last_received_at:string|null;description:string|null};
export type ScientificInventoryListResponse={data:ScientificInventoryItem[];meta:{current_page:number;last_page:number;total:number;per_page:number};links?:Record<string,string|null>};
export type ScientificInventoryListParams={employee_id?:string;product_id?:string;available_only?:boolean;search?:string;sort?:string;page?:number;per_page?:number};
export type AssignScientificInventoryData={employee_id:string;inventory_batch_id:string;quantity:number;description:string};