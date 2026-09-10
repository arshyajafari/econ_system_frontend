import { apiClient } from "../../../api/client";

import type {
  CustomerLedger,
  CustomerLedgerParams,
} from "../types/customerLedger";

export async function getCustomerLedger(
  customerId: string,
  params: CustomerLedgerParams = {},
): Promise<CustomerLedger> {
  const response = await apiClient.get<CustomerLedger>(
    `/customers/${customerId}/ledger`,
    {
      params: {
        from: params.from || undefined,
        to: params.to || undefined,
      },
    },
  );

  return response.data;
}
