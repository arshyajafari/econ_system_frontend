import { useCallback, useEffect, useState, useRef } from "react";
import { Pagination } from "../../../components/Pagination";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth";

import { ApiError } from "../../../api/client";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { CustomerFilters } from "../components/CustomerFilters";
import { CustomerForm } from "../components/CustomerForm";
import { CustomerTable } from "../components/CustomerTable";
import {
  changeCustomerStatus,
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../services/customersApi";
import type {
  Customer,
  CustomerFormData,
  CustomerStatus,
  CustomerType,
} from "../types/customer";

export function CustomersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const isAdmin = roles.includes("admin");
  const isSettlementOperator = roles.includes("settlement operator");
  const isAccountant = roles.includes("accountant");
  const canCreateCustomer = isAdmin || isAccountant;
  const canEditCustomer = !isSettlementOperator && (isAdmin || isAccountant);
  const canChangeCustomerStatus =
    isAdmin || permissions.includes("customers.change_status");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "">("");
  const [type, setType] = useState<CustomerType | "">("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const requestIdRef = useRef(0);

  const loadCustomers = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCustomers({
        search: search.trim() || undefined,
        status: status || undefined,
        type: type || undefined,
        page,
        per_page: 20,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setCustomers(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت مشتریان.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, search, status, type]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        void loadCustomers();
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCustomers, search]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setType("");
    setPage(1);
  }

  function openCreateForm() {
    setEditingCustomer(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) return;

    setIsFormOpen(false);
    setEditingCustomer(null);
    setFormError(null);
  }

  async function handleSubmit(data: CustomerFormData) {
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingCustomer) {
        const updated = await updateCustomer(editingCustomer.id, data);

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === updated.id ? updated : customer,
          ),
        );
      } else {
        await createCustomer(data);

        if (page !== 1) {
          setPage(1);
        } else {
          await loadCustomers();
        }
      }

      setIsFormOpen(false);
      setEditingCustomer(null);
      setFormError(null);
    } catch (error: unknown) {
      setFormError(
        error instanceof ApiError ? error.message : "خطا در ذخیره مشتری.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function requestDelete(customer: Customer) {
    if (pendingDeleteId || pendingStatusId) {
      return;
    }

    setDeleteTarget(customer);
  }

  async function handleDelete(customer: Customer) {
    if (pendingDeleteId || pendingStatusId) {
      return;
    }

    setPendingDeleteId(customer.id);
    setError(null);

    try {
      await deleteCustomer(customer.id);

      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      );

      setTotal((current) => Math.max(0, current - 1));

      if (customers.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      }
    } catch (error: unknown) {
      setError(error instanceof ApiError ? error.message : "خطا در حذف مشتری.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleStatusChange(
    customer: Customer,
    nextStatus: CustomerStatus,
  ) {
    if (
      customer.status === nextStatus ||
      pendingStatusId ||
      pendingDeleteId === customer.id
    ) {
      return;
    }

    setPendingStatusId(customer.id);
    setError(null);

    try {
      const updated = await changeCustomerStatus(customer.id, nextStatus);

      if (status && updated.status !== status) {
        setCustomers((current) =>
          current.filter((item) => item.id !== updated.id),
        );

        setTotal((current) => Math.max(0, current - 1));
      } else {
        setCustomers((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
    } catch (error: unknown) {
      setError(
        error instanceof ApiError ? error.message : "خطا در تغییر وضعیت مشتری.",
      );
    } finally {
      setPendingStatusId(null);
    }
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مشتریان</h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void loadCustomers();
            }}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            بروزرسانی
          </button>

          {canCreateCustomer ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              مشتری جدید
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => {
              void loadCustomers();
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      {isFormOpen ? (
        <CustomerForm
          key={editingCustomer?.id ?? "new"}
          customer={editingCustomer}
          isSubmitting={isSubmitting}
          error={formError}
          onSubmit={(data) => {
            void handleSubmit(data);
          }}
          onCancel={closeForm}
        />
      ) : null}

      <CustomerFilters
        search={search}
        status={status}
        type={type}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onTypeChange={(value) => {
          setType(value);
          setPage(1);
        }}
        onClear={resetFilters}
      />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Intl.NumberFormat("fa-IR").format(total)} مشتری</span>

        {isLoading && customers.length > 0 ? (
          <span>در حال بروزرسانی...</span>
        ) : null}
      </div>

      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        pendingStatusId={pendingStatusId}
        pendingDeleteId={pendingDeleteId}
        isAdmin={isAdmin}
        canEdit={canEditCustomer}
        canChangeStatus={canChangeCustomerStatus}
        onEdit={openEditForm}
        onDelete={requestDelete}
        onStatusChange={(customer, nextStatus) => {
          void handleStatusChange(customer, nextStatus);
        }}
        onViewLedger={(customer) => {
          navigate(`/customers/${customer.id}/ledger`);
        }}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="حذف مشتری"
        description={
          deleteTarget
            ? `آیا از حذف «${deleteTarget.customer_name}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
            : ""
        }
        confirmLabel="حذف مشتری"
        cancelLabel="انصراف"
        variant="danger"
        isLoading={pendingDeleteId !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget).finally(() =>
              setDeleteTarget(null),
            );
          }
        }}
      />

      {<Pagination page={page} lastPage={lastPage} isLoading={isLoading} total={total} onPageChange={setPage} />}
    </section>
  );
}
