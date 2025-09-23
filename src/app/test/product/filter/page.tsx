"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api/client";
import type { ProductFilter } from "../../../lib/types/product";

export default function ProductFilterPage() {
  const [products, setProducts] = useState<ProductFilter[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filtros dinámicos
  const filters: Record<string, string> = {
    gender: "Men",
    basecolour: "black",
    limit: "10",
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const query = new URLSearchParams(filters).toString();
        const data = await apiFetch<ProductFilter[]>(`/products/filter?${query}`);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    fetchData();
  }, []);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!products.length) return <div className="p-4">Cargando productos...</div>;

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Resultados del filtro</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((p) => (
          <div
            key={p.product_id}
            className="border rounded-lg p-3 shadow bg-white dark:bg-gray-800"
          >
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-32 object-contain mb-2"
            />
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-gray-500">
              {p.mastercategory} • {p.basecolour}
            </p>
            <p className="text-xs text-gray-400">
              {p.season} {p.year} — {p.usage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
