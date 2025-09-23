"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api/client";
import type { ProductSingle } from "../../../lib/types/product";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductSingle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<ProductSingle>(`/products/single/${id}`)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"));
  }, [id]);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!product) return <div className="p-4">Cargando producto...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-64 object-contain mb-4 border rounded"
      />
      <p><span className="font-semibold">ID:</span> {product.product_id}</p>
      <p><span className="font-semibold">Categoría:</span> {product.category}</p>
    </div>
  );
}
