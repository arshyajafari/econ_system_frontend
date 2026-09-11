export type ReportProduct = {
  id: string;
  code: string;
  title: string;
  quantity: number;
  total_amount: number;
};

export type ReportData = {
  period: { from: string; to: string };
  sales: { subtotal: number; discount: number; tax: number; total: number; invoice_count: number };
  payments: { total: number; count: number };
  orders: { total: number; completed: number };
  returns: { count: number; amount: number };
  receivables: { total: number };
  top_products: ReportProduct[];
};

export type ReportResponse = { data: ReportData };
