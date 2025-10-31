import { User, Bot } from 'lucide-react'
import type { ChatProduct } from '../lib/types/chat'
import ProductCard from './ProductCard'
import SimilarProductsCarousel from './SimilarProductsCarousel'

interface Props {
  role: 'user' | 'bot'
  text: string
  image?: string
  isVideo?: boolean
  product?: ChatProduct
  products?: ChatProduct[] // 👈 importante
  onFindSimilar?: (product: ChatProduct) => void
  onGenerateLook?: (product: ChatProduct) => void
  onViewLookWorn?: (products: ChatProduct[]) => void
  onAnimate?: (imageUrl: string) => void
  isLook?: boolean
}

export default function Message({
  role,
  text,
  image,
  isVideo,
  product,
  products,
  onFindSimilar,
  onGenerateLook,
  onViewLookWorn,
  onAnimate,
  isLook,
}: Props) {
  console.log('Message props:', { text, product, products })
  const isUser = role === 'user'

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300">
          <Bot size={18} />
        </div>
      )}

      <div
        className={`px-4 py-2 rounded-2xl shadow max-w-[75%] ${
          isUser
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none dark:bg-gray-700 dark:text-gray-100'
        }`}
      >
        <p className="mb-2">{text}</p>

        {image && (
          <div className="flex flex-col items-center my-3">
            {text?.includes('Video generado por IA') ? (
              <video
                src={image}
                controls
                className="rounded-xl max-w-full h-auto shadow-md object-contain"
                style={{ maxHeight: '600px' }}
              >
                Tu navegador no soporta video.
              </video>
            ) : (
              <img
                src={image}
                alt="Imagen generada"
                className="rounded-xl max-w-full h-auto shadow-md object-contain"
                style={{ maxHeight: '600px' }}
              />
            )}

            {/* 🔘 Botón Animar: solo para la imagen final */}
            {text?.includes('Imagen final generada por IA') && (
              <button
                className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
                onClick={() => onAnimate?.(image)}
              >
                Animar
              </button>
            )}
          </div>
        )}

        {product && (
          <ProductCard
            product={product}
            onFindSimilar={onFindSimilar}
            onGenerateLook={onGenerateLook}
          />
        )}

        {/* múltiples productos */}
        {/* Grid de varios productos */}
        {products && (
          <SimilarProductsCarousel
            products={products}
            onFindSimilar={onFindSimilar}
            onGenerateLook={onGenerateLook}
            onViewLookWorn={onViewLookWorn}
            isLook={isLook}
          />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  )
}
