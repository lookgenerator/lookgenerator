"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api/client";
import type { SimilarProductsResponse } from "../../../../lib/types/product";

export default function SimilarProductsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SimilarProductsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<SimilarProductsResponse>(`/products/similar/${id}`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unknown error")
      );
  }, [id]);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">Cargando productos similares...</div>;

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Producto base */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Producto base</h2>
        <img
          src={data.base_product.image_url}
          alt={data.base_product.name}
          className="w-40 h-40 object-contain mx-auto mb-2"
        />
        <p className="font-medium">{data.base_product.name}</p>
      </div>

      {/* Productos similares */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Productos similares</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.neighbors.map((n) => (
            <div
              key={n.product_id}
              className="border rounded-lg p-3 shadow bg-white dark:bg-gray-800"
            >
              <img
                src={n.image_url}
                alt={n.name}
                className="w-full h-32 object-contain mb-2"
              />
              <p className="text-sm font-medium">{n.name}</p>
              <p className="text-xs text-gray-500">
                Score: {n.score.toFixed(4)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
