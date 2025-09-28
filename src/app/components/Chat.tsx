'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Message from './Message'
import InputBox from './InputBox'
import useDarkMode from '../hooks/useDarkMode'
import { Moon, Sun } from 'lucide-react'
import { getProductById, getSimilarProducts } from '../lib/api/products'
import type { ChatProduct, MessageItem } from '../lib/types/chat'
import { getCustomerById } from '../lib/api/client'

export default function Chat() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const handleSend = async (msg: string) => {
    setMessages(prev => [...prev, { role: 'user', text: msg }])

    // detectar si es un número (posible customerId)
    if (/^\d+$/.test(msg.trim())) {
      try {
        const customer = await getCustomerById(msg.trim())

        setCustomerId(customer.customer_id)

        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `✅ Cliente encontrado: **${customer.first_name}** (ID: ${customer.customer_id}).`,
          },
        ])
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `❌ No se encontró un cliente con ese ID. (${err})`,
          },
        ])
      }
      return
    }

    // detectar si pide un producto
    const match = msg.match(/producto\s+(\d+)/i)
    if (match) {
      const productId = match[1]
      try {
        const product = await getProductById(productId)
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `Aquí tienes información del producto:`,
            product: {
              id: product.product_id,
              name: product.name,
              image_url: product.image_url,
              category: product.category,
              description:
                'Este es un producto destacado dentro de nuestro catálogo. Próximamente aquí aparecerá una descripción generada automáticamente por el asistente inteligente.',
            },
          },
        ])
      } catch (err) {
        setMessages(prev => [
          ...prev,
          { role: 'bot', text: '❌ Error al obtener el producto.', err },
        ])
      }
      return
    }

    // detectar similares
    const matchSimilar = msg.match(/similares\s+al\s+(\d+)/i)
    if (matchSimilar) {
      const productId = matchSimilar[1]
      try {
        const data = await getSimilarProducts(productId)

        const similarMessage: MessageItem = {
          role: 'bot',
          text: `Productos similares al ${productId}:`,
          products: data.neighbors.map(
            (p): ChatProduct => ({
              id: p.product_id,
              name: p.name,
              image_url: p.image_url,
              description:
                'Este es un producto destacado dentro de nuestro catálogo. Próximamente aquí aparecerá una descripción generada automáticamente por el asistente inteligente.',
            })
          ),
        }
        console.log('Similar message:', similarMessage)
        setMessages(prev => [...prev, similarMessage])
      } catch (err) {
        console.error('Error en getSimilarProducts:', err)
        setMessages(prev => [
          ...prev,
          { role: 'bot', text: '❌ Error al obtener productos similares.' },
        ])
      }
      return
    }

    // respuesta por defecto
    setMessages(prev => [
      ...prev,
      { role: 'bot', text: 'No entendí la petición 🤔' },
    ])
  }

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const [darkMode, setDarkMode] = useDarkMode()

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col w-full max-w-md h-[650px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-green-600 text-white shadow-md dark:bg-green-700">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/0/02/Logo_Corte_Ingl%C3%A9s.svg"
            alt="El Corte Inglés"
            width={40}
            height={40}
            className="rounded"
          />
          <h1 className="flex-1 text-2xl font-extrabold tracking-tight">
            Asistente Virtual
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-green-500/20 transition"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Chat body */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900"
        >
          {messages.map((m, i) => (
            <Message
              key={i}
              role={m.role}
              text={m.text}
              product={m.product}
              products={m.products}
            />
          ))}
        </div>

        {/* Input */}
        <InputBox onSend={handleSend} />
      </div>
    </div>
  )
}
