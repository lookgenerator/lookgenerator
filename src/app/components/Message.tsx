import { User, Bot } from 'lucide-react'
import type { ChatProduct } from '../lib/types/chat'

type Props = {
  role: 'user' | 'bot'
  text: string
  product?: ChatProduct
}

export default function Message({ role, text, product }: Props) {
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

        {product && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden w-56">
            {/* Imagen con tamaño fijo */}
            <div className="w-full h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Contenido */}
            <div className="p-3">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                {product.name}
              </h3>
              {product.category && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Categoría: {product.category}
                </p>
              )}
              {product.id && (
                <p className="text-xs text-gray-400 mt-1">ID: {product.id}</p>
              )}
            </div>
          </div>
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
