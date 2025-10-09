"use client";
import ProductCard from "./ProductCard";
import type { ChatProduct } from "../lib/types/chat";

export default function SimilarProductsGrid({ products }: { products: ChatProduct[] }) {
  if (!products || products.length === 0) {
    return <p className="text-sm text-gray-500">⚠️ No hay productos similares disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
