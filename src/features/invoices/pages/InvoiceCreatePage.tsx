import { useCallback, useState } from 'react';
import { Button } from '../../../design-system/components/Button';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { BackButton } from '../../../components/BackButton';
import { SearchableOrderSelect } from '../../../components/SearchableOrderSelect';
import { getOrders } from '../../orders/services/ordersApi';
import { createInvoiceFromOrder } from '../services/invoicesApi';
import type { Order } from '../../orders/types/order';

export function InvoiceCreatePage() {
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchOrders = useCallback(async (query: string): Promise<Order[]> => {
        try {
            const response = await getOrders({
                invoiceable: true,
                search: query.trim() || undefined,
                sort: '-created_at',
                per_page: 20,
                page: 1,
            });
            return response.data;
        } catch (requestError: unknown) {
            setError(
                requestError instanceof ApiError && requestError.message
                    ? requestError.message
                    : 'خطا در جستجوی سفارش‌های قابل ایجاد فاکتور.'
            );
            return [];
        }
    }, []);

    async function submit() {
        if (!order || busy) return;
        setBusy(true);
        setError(null);
        try {
            const invoice = await createInvoiceFromOrder(order.id);
            navigate(`/invoices/${invoice.id}`);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof ApiError && requestError.message
                    ? requestError.message
                    : 'ایجاد فاکتور انجام نشد.'
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-6 p-4 md:p-6">
            <div>
                <BackButton fallbackTo="/invoices" label="بازگشت به فاکتورها" />
                <div className="my-2" />
                <h1 className="text-2xl font-bold text-gray-900">ثبت فاکتور</h1>
            </div>
            {error ? (
                <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}
            <div className="w-full rounded-xl border border-gray-200 bg-white p-6">
                <label className="block text-sm font-medium text-gray-700">
                    سفارش قابل ایجاد فاکتور
                </label>
                <div className="mt-2">
                    <SearchableOrderSelect
                        value={order?.id ?? ''}
                        selectedOrder={order}
                        disabled={busy}
                        searchOrders={searchOrders}
                        onChange={setOrder}
                        placeholder="جستجو بر اساس کد سفارش یا نام مشتری..."
                    />
                </div>
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        onClick={() => void submit()}
                        disabled={!order || busy}
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? 'در حال ایجاد...' : 'ایجاد فاکتور'}
                    </Button>
                </div>
            </div>
        </section>
    );
}
