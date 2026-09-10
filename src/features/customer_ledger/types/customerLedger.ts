export type CustomerLedgerSourceType = "invoice" | "payment" | "order_return";

export type CustomerLedgerSource = {
  type: CustomerLedgerSourceType;
  id: string;
  code?: string | null;
  reference_number?: string | null;
};

export type CustomerLedgerTransaction = {
  id: string;
  type: "debit" | "credit";
  debit: number | string;
  credit: number | string;
  balance: number | string;
  amount: number | string;
  transaction_at: string | null;
  description: string | null;
  source: CustomerLedgerSource | null;
};

export type CustomerLedger = {
  customer: {
    id: string;
    name: string;
  };
  opening_balance: number | string;
  total_debit: number | string;
  total_credit: number | string;
  closing_balance: number | string;
  transactions: CustomerLedgerTransaction[];
};

export type CustomerLedgerParams = {
  from?: string;
  to?: string;
};
