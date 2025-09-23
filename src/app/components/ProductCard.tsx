"use client";
import { useState, useRef } from "react";
import type { ChatProduct } from "../lib/types/chat";

function DescriptionWithFade({ text }: { text: string }) {
  const [isAtEnd, setIsAtEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setIsAtEnd(scrollTop + clientHeight >= scrollHeight - 2);
    }
  };

  return (
    <div className="relative group max-h-24 overflow-hidden">
      {/* Texto con scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="text-sm text-gray-700 max-h-24 overflow-y-auto px-1 pr-2
                   scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                   [scrollbar-width:none] group-hover:[scrollbar-width:thin]"
      >
        {text}
      </div>

      {/* Fade inferior (solo si no estamos al final) */}
      {!isAtEnd && (
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-6 
                        bg-gradient-to-t from-white to-transparent dark:from-gray-800" />
      )}
    </div>
  );
}

export default function ProductCard({ product }: { product: ChatProduct }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`relative transition-all duration-500 ease-in-out ${
        flipped ? "w-full h-[420px]" : "w-48 h-64"
      }`}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Cara frontal */}
        <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center justify-between rounded-lg shadow-md bg-white dark:bg-gray-800 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-32 object-contain"
          />
          <div className="p-2 text-center">
            <div className="font-medium text-xs text-gray-900 dark:text-gray-100 line-clamp-2">
              {product.name}
            </div>
            <button
              className="mt-2 bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
              onClick={() => setFlipped(true)}
            >
              Ver más
            </button>
          </div>
        </div>

        {/* Cara trasera */}
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col justify-between">
          <div className="overflow-y-auto">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-40 object-contain mb-3"
            />
            <div className="font-semibold text-lg mb-2">{product.name}</div>
            {product.category && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Categoría: {product.category}
              </p>
            )}
            {product.id && (
              <p className="text-xs text-gray-400 mb-2">ID: {product.id}</p>
            )}
            {product.description && (
              <DescriptionWithFade text={product.description} />
            )}
          </div>
          <button
            className="mt-4 bg-gray-600 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-700 transition-colors"
            onClick={() => setFlipped(false)}
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
