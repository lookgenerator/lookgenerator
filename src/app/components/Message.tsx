import { User, Bot } from 'lucide-react'
import type { ChatProduct } from '../lib/types/chat'
import ProductCard from './ProductCard'
import SimilarProductsCarousel from "./SimilarProductsCarousel";

interface Props {
  role: "user" | "bot";
  text: string;
  product?: ChatProduct;
  products?: ChatProduct[]; // 👈 importante
  onFindSimilar?: (product: ChatProduct) => void;
}

export default function Message({ role, text, product, products,onFindSimilar }: Props){
   console.log("Message props:", { text, product, products });
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

        {product && <ProductCard product={product} onFindSimilar={onFindSimilar} />}

        {/* múltiples productos */}
        {/* Grid de varios productos */}
        {products && <SimilarProductsCarousel products={products} onFindSimilar={onFindSimilar} />}
      </div>

      {isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  )
}
