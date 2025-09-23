import { apiFetch } from "./client";
import type { ProductSingle } from "../types/product";

export async function getProductById(id: string | number) {
  return apiFetch<ProductSingle>(`/products/single/${id}`);
}
