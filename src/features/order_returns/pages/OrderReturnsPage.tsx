import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";
import { useAuth } from "../../auth";

import { ApiError } from "../../../api/client";
import { Pagination } from "../../../components/Pagination";

import { getOrderReturns } from "../services/orderReturnsApi";

import type {
  OrderReturn,
  OrderReturnListParams,
  OrderReturnStatus,
} from "../types/orderReturn";

import { ORDER_RETURN_STATUS_OPTIONS } from "../types/orderReturn";

import { OrderReturnTable } from "../components/OrderReturnTable";

export function OrderReturnsPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const canCreateReturn =
    roles.includes("admin") ||
    roles.includes("accountant") ||
    roles.includes("sales visitor") ||
    roles.includes("delivery operator");

  const [orderReturns, setOrderReturns] = useState<OrderReturn[]>([]);

  const [status, setStatus] = useState<OrderReturnStatus | "">("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadOrderReturns = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    const params: OrderReturnListParams = {
      page,
      per_page: 20,
      sort: "-created_at",
    };

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params.search = normalizedSearch;
    }

    if (status) {
      params.status = status;
    }

    try {
      const response = await getOrderReturns(params);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setOrderReturns(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "دریافت مرجوعی‌ها ناموفق بود.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrderReturns();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrderReturns]);

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مرجوعی سفارش‌ها</h1>
        </div>

        {canCreateReturn ? (
          <Link
            to="/order-returns/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ثبت مرجوعی جدید
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="order-return-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              جستجو
            </label>

            <input
              id="order-return-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="کد مرجوعی، سفارش یا توضیحات..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="order-return-status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              وضعیت
            </label>

            <select
              id="order-return-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as OrderReturnStatus | "");
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              <option value="">همه وضعیت‌ها</option>

              {ORDER_RETURN_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              void loadOrderReturns();
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Intl.NumberFormat("fa-IR").format(total)} مرجوعی</span>
      </div>

      <OrderReturnTable
        orderReturns={orderReturns}
        isLoading={isLoading}
        onUpdated={(updated) =>
          setOrderReturns((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          )
        }
      />

      <Pagination
        page={page}
        lastPage={lastPage}
        isLoading={isLoading}
        total={total}
        onPageChange={setPage}
      />
    </section>
  );
}
