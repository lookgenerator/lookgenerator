'use client'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
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
    <div className="relative group h-full overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="text-sm md:text-base text-gray-700 dark:text-gray-200 overflow-y-auto px-1 pr-2
                   scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500 scrollbar-track-transparent
                   [scrollbar-width:none] group-hover:[scrollbar-width:thin]"
      >
        {text}
      </div>
      {!isAtEnd && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-8 
                        bg-gradient-to-t from-white to-transparent dark:from-gray-900"
        />
      )}
    </div>
  )
}

function ExpandedCard({
  product,
  description,
  loadingDesc,
  onBack,
  isSimilar
}: {
  product: ChatProduct
  description: string
  loadingDesc: boolean
  onBack: () => void
  isSimilar: boolean
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        id="expanded-card"
        className="relative flex flex-col w-[90%] max-w-md h-[85%] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden
                   transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                   animate-expandFlip"
      >
        {/* Cabecera con imagen y datos */}
        <div className="flex-shrink-0 flex flex-col items-center p-5 border-b dark:border-gray-700">
          {/* 🔹 Código del producto en la esquina superior derecha */}
          <div
            className="absolute top-3 right-4 bg-gray-100/80 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded-md shadow-sm select-none"
            title="Código del producto"
          >
            ID: {product.id}
          </div>
          <img
            src={
              product.image_url ||
              'https://img.freepik.com/vector-premium/no-hay-foto-disponible-icono-vectorial-simbolo-imagen-predeterminado-imagen-proximamente-sitio-web-o-aplicacion-movil_87543-10615.jpg'
            }
            alt={product.name}
            onError={e => {
              const target = e.currentTarget
              target.src =
                'https://img.freepik.com/vector-premium/no-hay-foto-disponible-icono-vectorial-simbolo-imagen-predeterminado-imagen-proximamente-sitio-web-o-aplicacion-movil_87543-10615.jpg'
            }}
            className="w-full h-64 object-contain mb-4 transition-all duration-500 ease-out"
          />
          <h3 className="font-semibold text-xl mb-1 text-gray-900 dark:text-gray-100 text-center">
            {product.name}
          </h3>
          {product.category && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Categoría: {product.category}
            </p>
          )}
          {product.score !== undefined && (
            <p className="text-xs text-gray-500 italic">
              Similitud: {product.score.toFixed(3)}%
            </p>
          )}
        </div>

        {/* Descripción ocupando casi todo el espacio restante */}
        <div className="flex-1 p-5 overflow-y-auto text-base leading-relaxed">
          {loadingDesc ? (
            <div className="flex justify-center items-center h-full gap-1 text-gray-400">
              <span className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-3 h-3 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
              <span className="w-3 h-3 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-200 text-justify">
              {description}
            </p>
          )}
        </div>

        {/* Botón siempre visible abajo */}
<div className="flex-shrink-0 p-4 border-t dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex gap-3">
  <button
    onClick={onBack}
    className="flex-1 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors"
  >
    Volver
  </button>

  {isSimilar && (
    <button
      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
      onClick={() => console.log(`🟢 Buscar similares para ${product.name}`)}
    >
      Buscar similares
    </button>
  )}
</div>

      </div>
    </div>,
    document.body
  )
}

export default function ProductCard({ product, isSimilar=false }: { product: ChatProduct; isSimilar?: boolean  }) {
  const [expanded, setExpanded] = useState(false)
  const [loadingDesc, setLoadingDesc] = useState(false)
  const [description, setDescription] = useState(
    product.description ??
      'Descripción genérica del producto. Aquí aparecerá información extendida cuando se conecte el LLM.'
  )

  async function handleViewMore() {
    setExpanded(true)
    const cacheKey = `product_desc_${product.id}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) return setDescription(cached)

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
      const desc = data.description || 'No se pudo generar una descripción.'
      setDescription(desc)
      localStorage.setItem(cacheKey, desc)
    } catch {
      setDescription('❌ Error generando descripción.')
    } finally {
      setLoadingDesc(false)
    }
  }

  const handleBack = () => {
    const card = document.getElementById('expanded-card')
    if (card) {
      card.classList.remove('animate-expandFlip')
      card.classList.add('animate-collapseFlip')
      setTimeout(() => setExpanded(false), 550)
    } else {
      setExpanded(false)
    }
  }

  return (
    <>
      <div className="relative w-36 h-56 sm:w-48 sm:h-64 transition-all duration-500 ease-in-out hover:scale-[1.02]">
        <div className="absolute inset-0 flex flex-col items-center justify-between rounded-xl shadow-md bg-white dark:bg-gray-800 overflow-hidden">
          <img
            src={
              product.image_url ||
              'https://img.freepik.com/vector-premium/no-hay-foto-disponible-icono-vectorial-simbolo-imagen-predeterminado-imagen-proximamente-sitio-web-o-aplicacion-movil_87543-10615.jpg'
            }
            alt={product.name}
            onError={e => {
              const target = e.currentTarget
              target.src =
                'https://img.freepik.com/vector-premium/no-hay-foto-disponible-icono-vectorial-simbolo-imagen-predeterminado-imagen-proximamente-sitio-web-o-aplicacion-movil_87543-10615.jpg'
            }}
            className="w-full h-32 object-contain"
          />
          <div className="p-2 text-center">
            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2">

              {product.name}
            </div>
            {product.score !== undefined && (
              <div className="mt-1 text-xs text-gray-500">
                Similitud: {product.score.toFixed(3)}%
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
      </div>

      {expanded && (
        <ExpandedCard
          product={product}
          description={description}
          loadingDesc={loadingDesc}
          onBack={handleBack}
          isSimilar={isSimilar}
        />
      )}
    </>
  )
}
