import { apiClient } from "../../../api/client";

import type {
  Product,
  ProductBrand,
  ProductCategory,
  ProductFormData,
  ProductListParams,
  ProductListResponse,
  ProductStatus,
} from "../types/product";

type ProductApiPayload = {
  brand_id: string;
  product_category_id: string;
  title: string;
  barcode?: string;
  sort_order: number;
  status: ProductStatus;
  image?: string;
  description?: string;
};

export async function getProducts(
  params: ProductListParams = {},
): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/products", {
    params,
  });

  return response.data;
}

export async function getProduct(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${id}`);

  return response.data;
}

export async function createProduct(
  payload: ProductFormData,
): Promise<Product> {
  const response = await apiClient.post<Product>(
    "/products",
    normalizeProductPayload(payload),
  );

  return response.data;
}

export async function updateProduct(
  id: string,
  payload: ProductFormData,
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `/products/${id}`,
    normalizeProductPayload(payload),
  );

  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function changeProductStatus(
  id: string,
  status: ProductStatus,
): Promise<Product> {
  const response = await apiClient.patch<Product>(`/products/${id}/status`, {
    status,
  });

  return response.data;
}

export async function getBrands(): Promise<ProductBrand[]> {
  const response = await apiClient.get<ProductBrand[]>("/brands", {
    params: {
      per_page: 500,
    },
  });

  return response.data;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const response = await apiClient.get<ProductCategory[]>(
    "/product-categories",
    {
      params: {
        per_page: 500,
      },
    },
  );

  return response.data;
}

function normalizeProductPayload(payload: ProductFormData): ProductApiPayload {
  return {
    brand_id: payload.brand_id,
    product_category_id: payload.product_category_id,
    title: payload.title.trim(),
    barcode: payload.barcode.trim() || undefined,
    sort_order: payload.sort_order,
    status: payload.status,
    image: payload.image.trim() || undefined,
    description: payload.description.trim() || undefined,
  };
}
