import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../../../api/client";
import { ProductFilters } from "../components/ProductFilters";
import { ProductForm } from "../components/ProductForm";
import { ProductTable } from "../components/ProductTable";
import {
  changeProductStatus,
  createProduct,
  deleteProduct,
  getProductBrands,
  getProductCategories,
  getProducts,
  updateProduct,
} from "../services/productsApi";
import type {
  Product,
  ProductBrand,
  ProductCategory,
  ProductFormData,
  ProductStatus,
} from "../types/product";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadLookups = useCallback(async () => {
    setIsLoadingLookups(true);

    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        getProductBrands(),
        getProductCategories(),
      ]);

      setBrands(brandsResponse);
      setCategories(categoriesResponse);
    } catch (error: unknown) {
      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت برندها و دسته‌بندی‌ها.",
      );
    } finally {
      setIsLoadingLookups(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProducts({
        search: search.trim() || undefined,
        brand_id: brandId || undefined,
        product_category_id: categoryId || undefined,
        status: status || undefined,
        page,
        per_page: 20,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setProducts(response.data);
      setLastPage(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(
        error instanceof ApiError && error.message
          ? error.message
          : "خطا در دریافت محصولات.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [brandId, categoryId, page, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLookups();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadLookups]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        void loadProducts();
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadProducts, search]);

  function resetFilters() {
    setSearch("");
    setBrandId("");
    setCategoryId("");
    setStatus("");
    setPage(1);
  }

  function openCreateForm() {
    setEditingProduct(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setEditingProduct(null);
    setFormError(null);
  }

  async function handleSubmit(data: ProductFormData) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, data);

        setProducts((current) =>
          current.map((product) =>
            product.id === updated.id ? updated : product,
          ),
        );
      } else {
        await createProduct(data);

        if (page !== 1) {
          setPage(1);
        } else {
          await loadProducts();
        }
      }

      setIsFormOpen(false);
      setEditingProduct(null);
      setFormError(null);
    } catch (error: unknown) {
      setFormError(
        error instanceof ApiError ? error.message : "خطا در ذخیره محصول.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product: Product) {
    if (pendingDeleteId || pendingStatusId) {
      return;
    }

    const confirmed = window.confirm(
      `آیا از حذف «${product.title}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    const isLastItemOnPage = products.length === 1;

    setPendingDeleteId(product.id);
    setError(null);

    try {
      await deleteProduct(product.id);

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );

      setTotal((current) => Math.max(0, current - 1));

      if (isLastItemOnPage && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      }
    } catch (error: unknown) {
      setError(error instanceof ApiError ? error.message : "خطا در حذف محصول.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleStatusChange(
    product: Product,
    nextStatus: ProductStatus,
  ) {
    if (product.status === nextStatus || pendingStatusId || pendingDeleteId) {
      return;
    }

    setPendingStatusId(product.id);
    setError(null);

    try {
      const updated = await changeProductStatus(product.id, nextStatus);

      if (status && updated.status !== status) {
        setProducts((current) =>
          current.filter((item) => item.id !== updated.id),
        );

        setTotal((current) => Math.max(0, current - 1));

        if (products.length === 1 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
      } else {
        setProducts((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
    } catch (error: unknown) {
      setError(
        error instanceof ApiError ? error.message : "خطا در تغییر وضعیت محصول.",
      );
    } finally {
      setPendingStatusId(null);
    }
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">محصولات</h1>

          <p className="mt-1 text-sm text-gray-500">
            مدیریت محصولات، برندها و دسته‌بندی محصولات
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void loadProducts();
            }}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            بروزرسانی
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            disabled={
              isLoadingLookups || brands.length === 0 || categories.length === 0
            }
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            محصول جدید
          </button>
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
              void Promise.all([loadProducts(), loadLookups()]);
            }}
            className="self-start rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100 sm:self-auto"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      {isFormOpen ? (
        <ProductForm
          key={editingProduct?.id ?? "new"}
          product={editingProduct}
          brands={brands}
          categories={categories}
          isSubmitting={isSubmitting}
          error={formError}
          onSubmit={(data) => {
            void handleSubmit(data);
          }}
          onCancel={closeForm}
        />
      ) : null}

      <ProductFilters
        search={search}
        brandId={brandId}
        categoryId={categoryId}
        status={status}
        brands={brands}
        categories={categories}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onBrandChange={(value) => {
          setBrandId(value);
          setPage(1);
        }}
        onCategoryChange={(value) => {
          setCategoryId(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onClear={resetFilters}
      />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Intl.NumberFormat("fa-IR").format(total)} محصول</span>

        {isLoading && products.length > 0 ? (
          <span>در حال بروزرسانی...</span>
        ) : null}
      </div>

      <ProductTable
        products={products}
        isLoading={isLoading}
        pendingStatusId={pendingStatusId}
        pendingDeleteId={pendingDeleteId}
        onEdit={openEditForm}
        onDelete={(product) => {
          void handleDelete(product);
        }}
        onStatusChange={(product, nextStatus) => {
          void handleStatusChange(product, nextStatus);
        }}
      />

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            قبلی
          </button>

          <span className="text-sm text-gray-600">
            صفحه {new Intl.NumberFormat("fa-IR").format(page)} از{" "}
            {new Intl.NumberFormat("fa-IR").format(lastPage)}
          </span>

          <button
            type="button"
            disabled={page >= lastPage || isLoading}
            onClick={() =>
              setPage((current) => Math.min(lastPage, current + 1))
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            بعدی
          </button>
        </div>
      ) : null}
    </section>
  );
}
