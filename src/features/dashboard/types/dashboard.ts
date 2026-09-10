export type DashboardSales = {
  today: number;
  month: number;
  year: number;
};

export type DashboardOrders = {
  today: number;
  month: number;
};

export type DashboardPayments = {
  today: number;
  month: number;
};

export type DashboardReceivables = {
  total: number;
};

export type DashboardReturns = {
  pending: number;
  confirmed: number;
};

export type DashboardDeliveries = {
  pending: number;
  shipped: number;
};

export type DashboardVisits = {
  today: number;
  month: number;
};

export type DashboardSamples = {
  today: number;
  month: number;
};

export type DashboardInventory = {
  batches: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expired_batches: number;
  near_expire_batches: number;
};

export type DashboardRecentOrder = {
  id: string;
  code: string;
  status: string | null;
  created_at: string | null;
};

export type DashboardRecentPayment = {
  id: string;
  reference_number: string | null;
  amount: number;
  status: string | null;
  customer: {
    id: string;
    name: string;
  } | null;
  created_at: string | null;
};

export type DashboardRecentReturn = {
  id: string;
  code: string;
  status: string | null;
  created_at: string | null;
};

export type DashboardRecentVisit = {
  id: string;
  visit_date: string | null;
  status: string | null;
  doctor: {
    id: string;
    name: string;
  } | null;
};

export type DashboardRecent = {
  orders: DashboardRecentOrder[];
  payments: DashboardRecentPayment[];
  returns: DashboardRecentReturn[];
  visits: DashboardRecentVisit[];
};

export type DashboardData = {
  sales: DashboardSales;
  orders: DashboardOrders;
  payments: DashboardPayments;
  receivables: DashboardReceivables;
  returns: DashboardReturns;
  deliveries: DashboardDeliveries;
  visits: DashboardVisits;
  samples: DashboardSamples;
  inventory: DashboardInventory;
  recent: DashboardRecent;
};

export type DashboardResponse = {
  data: DashboardData;
};
