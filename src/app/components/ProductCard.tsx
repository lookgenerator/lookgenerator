'use client'
import { useState, useRef } from 'react'
import type { ChatProduct } from '../lib/types/chat'

function DescriptionWithFade({ text }: { text: string }) {
  const [isAtEnd, setIsAtEnd] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setIsAtEnd(scrollTop + clientHeight >= scrollHeight - 2)
    }
  }

  return (
    <div className="relative group h-full max-h-24 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="text-sm text-gray-700 h-full max-h-24 overflow-y-auto px-1 pr-2
                   scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                   [scrollbar-width:none] group-hover:[scrollbar-width:thin]"
      >
        {text}
      </div>

      {!isAtEnd && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-6 
                        bg-gradient-to-t from-white to-transparent dark:from-gray-800"
        />
      )}
    </div>
  )
}

export default function ProductCard({ product }: { product: ChatProduct }) {
  const [flipped, setFlipped] = useState(false)
  const [loadingDesc, setLoadingDesc] = useState(false)
  const [description, setDescription] = useState(
    product.description ??
      'Descripción genérica del producto. Aquí aparecerá información extendida cuando se conecte el LLM.'
  )

  // 🔹 Nueva función: genera descripción con LLM
  // dentro de ProductCard
  async function handleViewMore() {
    setFlipped(true)

    const cacheKey = `product_desc_${product.id}`

    // 🔹 1️⃣ Buscar descripción en localStorage
    const cachedDesc = localStorage.getItem(cacheKey)
    if (cachedDesc) {
      setDescription(cachedDesc)
      return
    }

    // 🔹 2️⃣ Si ya tiene una descripción que no es genérica, úsala
    if (description && !description.includes('genérica')) return

    try {
      setLoadingDesc(true)

      const res = await fetch('/api/llm/product-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          category: product.category,
        }),
      })

      const data = await res.json()

      const desc =
        data.description ||
        'No se pudo generar una descripción personalizada en este momento.'

      setDescription(desc)

      // 🔹 3️⃣ Guardar en localStorage para futuras veces
      localStorage.setItem(cacheKey, desc)
    } catch (err) {
      console.error('Error generando descripción:', err)
      setDescription(
        '❌ Ocurrió un error al generar la descripción. Inténtalo más tarde.'
      )
    } finally {
      setLoadingDesc(false)
    }
  }

  return (
    <div
      className={`relative transition-all duration-500 ease-in-out ${
        flipped ? 'w-full h-[490px]' : 'w-48 h-64'
      }`}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Cara frontal */}
        <div
          className="absolute inset-0 h-full [backface-visibility:hidden] flex flex-col items-center justify-between 
                     rounded-lg shadow-md bg-white dark:bg-gray-800 overflow-hidden"
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-32 object-contain"
          />
          <div className="p-2 text-center">
            <div className="font-bold text-xs text-gray-900 dark:text-gray-100 line-clamp-2">
              {product.name}
            </div>
{product.score !== undefined && (
  <div className="mt-1">
    <p className="text-xs text-gray-500 mb-1">
      Similitud: {(product.score).toFixed(4)}%
    </p>
    
  </div>
)}
            <button
              className="mt-2 bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 transition-colors"
              onClick={handleViewMore}
            >
              Ver más
            </button>
          </div>
        </div>

        {/* Cara trasera */}
        <div
          className="absolute inset-0 h-full [transform:rotateY(180deg)] [backface-visibility:hidden] 
                     bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col"
        >
          {/* Parte superior */}
          <div className="flex-shrink-0 p-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-40 object-contain mb-3"
            />
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            {product.category && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Categoría: {product.category}
              </p>
            )}
            {product.id && (
              <p className="text-xs text-gray-400 mb-2">ID: {product.id}</p>
            )}
          </div>

          {/* Centro → descripción con scroll */}
          <div className="flex-1 px-4 flex items-center justify-center">
            {loadingDesc ? (
              <div className="flex gap-1 items-center text-gray-500 dark:text-gray-300">
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            ) : (
              <DescriptionWithFade text={description} />
            )}
          </div>

          {/* Botón abajo */}
          <div className="flex-shrink-0 p-4">
            <button
              onClick={() => setFlipped(false)}
              className="w-full bg-gray-600 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
