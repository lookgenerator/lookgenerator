import { apiFetch } from "./client";
import type { ProductSingle } from "../types/product";
import type { SimilarProductsResponse } from "../types/product";

export async function getProductById(id: string | number) {
  return apiFetch<ProductSingle>(`/products/single/${id}`);
}

export async function getSimilarProducts(id: string | number) {
  const res = await apiFetch<SimilarProductsResponse>(`/products/similar/${id}`);

  // 🔹 Excluir el producto base
  const baseId = res.base_product.product_id;
  const uniqueNeighbors = Array.from(
    new Map(
      res.neighbors
        .filter(n => n.product_id !== baseId)
        .map(n => [n.product_id, n])
    ).values()
  );

  // 🔹 Limitar a máximo 10 si quieres consistencia visual
  return {
    ...res,
    neighbors: uniqueNeighbors.slice(0, 10),
  };
}