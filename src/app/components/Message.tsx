import { User, Bot } from 'lucide-react'
import type { ChatProduct } from '../lib/types/chat'
import ProductCard from './ProductCard'
import SimilarProductsCarousel from './SimilarProductsCarousel'

interface Props {
  role: 'user' | 'bot'
  text: string
  image?: string
  product?: ChatProduct
  products?: ChatProduct[] // 👈 importante
  onFindSimilar?: (product: ChatProduct) => void
  onGenerateLook?: (product: ChatProduct) => void
  onViewLookWorn?: (products: ChatProduct[]) => void
  isLook?: boolean
}

export default function Message({
  role,
  text,
  image,
  product,
  products,
  onFindSimilar,
  onGenerateLook,
  onViewLookWorn,
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
  <div className="flex justify-center my-3">
    <img
      src={image}
      alt="Imagen generada"
      className="rounded-xl max-w-full h-auto shadow-md object-contain"
      style={{
        maxHeight: "600px", // 🔹 permite ver la imagen completa
      }}
    />
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
