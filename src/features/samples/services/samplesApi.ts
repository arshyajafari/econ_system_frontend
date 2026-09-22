import { apiClient } from "../../../api/client";
import type { Product, ProductListResponse } from "../../products/types/product";
import type { Visit, VisitListResponse } from "../../visits/types/visit";
import { getScientificInventory } from "../../scientific_inventory/services/scientificInventoryApi";
import type { Sample, SampleFormData, SampleListParams, SampleListResponse } from "../types/sample";

export async function getSamples(params: SampleListParams = {}): Promise<SampleListResponse> {
  const response = await apiClient.get<SampleListResponse>("/samples", { params });
  return response.data;
}

export async function getSample(id: string): Promise<Sample> {
  const response = await apiClient.get<Sample>(`/samples/${id}`);
  return response.data;
}

export async function createSample(data: SampleFormData): Promise<Sample> {
  const response = await apiClient.post<Sample>("/samples", {
    visit_id: data.visit_id,
    product_id: data.product_id,
    quantity: data.quantity,
    description: data.description.trim() || undefined,
  });
  return response.data;
}

export async function updateSample(id: string, data: Pick<SampleFormData, "quantity" | "description">): Promise<Sample> {
  const response = await apiClient.put<Sample>(`/samples/${id}`, {
    quantity: data.quantity,
    description: data.description.trim() || undefined,
  });
  return response.data;
}

export async function deleteSample(id: string): Promise<void> {
  await apiClient.delete(`/samples/${id}`);
}

export async function getSampleVisits(): Promise<Visit[]> {
  const response = await apiClient.get<VisitListResponse>("/visits", {
    params: { sort: "-visit_date", per_page: 100 },
  });
  return response.data.data.filter((visit) => visit.status !== "cancelled");
}

export async function getSampleProducts(isScientificVisitor = false): Promise<Product[]> {
  if (isScientificVisitor) {
    const response = await getScientificInventory({ available_only: true, per_page: 100, sort: "-last_received_at" });
    return response.data.map((item) => ({
      id: item.product?.id ?? "",
      code: item.product?.code ?? "",
      title: item.product?.title ?? "",
      current_price: item.product?.sale_price ? { id: "", sale_price: item.product.sale_price, effective_from: null } : null,
      image: null,
      barcode: null,
      status: "active",
      sort_order: 0,
      description: null,
      brand: null,
      category: null,
      created_at: null,
      updated_at: null,
      available_quantity: item.available_quantity,
    })) as Product[];
  }

  const response = await apiClient.get<ProductListResponse>("/products", {
    params: { status: "active", per_page: 100 },
  });
  return response.data.data;
}