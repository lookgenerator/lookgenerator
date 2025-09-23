import { apiFetch } from "./client";
import type { ProductSingle } from "../types/product";
import type { SimilarProductsResponse } from "../types/product";

export async function getProductById(id: string | number) {
  return apiFetch<ProductSingle>(`/products/single/${id}`);
}

export async function getSimilarProducts(id: string | number) {
  return apiFetch<SimilarProductsResponse>(`/products/similar/${id}`);
}