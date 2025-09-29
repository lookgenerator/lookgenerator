'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Message from './Message'
import InputBox from './InputBox'
import TypingIndicator from './TypingIndicator'
import useDarkMode from '../hooks/useDarkMode'
import { Moon, Sun } from 'lucide-react'
import { getProductById, getSimilarProducts } from '../lib/api/products'
import type { ChatProduct, MessageItem } from '../lib/types/chat'
import { getCustomerById } from '../lib/api/client'
import type { Customer } from '../lib/types/customer'
import { User } from 'lucide-react'
import { detectIntent } from '../lib/api/llm'

export default function Chat() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const chatRef = useRef<HTMLDivElement>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  const handleSend = async (msg: string) => {
    setMessages(prev => [...prev, { role: 'user', text: msg }])

    setIsLoading(true)

    try {
      const { intent, entities } = await detectIntent(msg)

      // 🔎 DEBUG solo si NEXT_PUBLIC_DEBUG = "true"
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `🛠️ Debug → Intent: **${intent}** | Entities: ${JSON.stringify(
              entities
            )}`,
          },
        ])
      }

      switch (intent) {
        case 'saludo':
          setMessages(prev => [
            ...prev,
            { role: 'bot', text: '👋 ¡Hola! ¿En qué puedo ayudarte hoy?' },
          ])
          break

        case 'identificar_usuario':
          if (entities.customer_id) {
            try {
              const customer = await getCustomerById(
                String(entities.customer_id)
              )
              setCustomer(customer)

              setMessages(prev => [
                ...prev,
                {
                  role: 'bot',
                  text: `✅ Cliente encontrado: **${customer.first_name}** (ID: ${customer.customer_id}).`,
                },
              ])

              if (customer.products && customer.products.length > 0) {
                const baseProduct = customer.products[0]

                setMessages(prev => [
                  ...prev,
                  {
                    role: 'bot',
                    text: `Estos son algunos de tus productos:`,
                    product: {
                      id: baseProduct.product_id,
                      name: baseProduct.name,
                      image_url: baseProduct.image_url,
                      description:
                        'Este es un producto destacado dentro de nuestro catálogo. Próximamente aquí aparecerá una descripción generada automáticamente por el asistente inteligente.',
                    },
                  },
                ])

                const data = await getSimilarProducts(baseProduct.product_id)
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'bot',
                    text: `Productos similares a ${baseProduct.name}:`,
                    products: data.neighbors.map(p => ({
                      id: p.product_id,
                      name: p.name,
                      image_url: p.image_url,
                      description:
                        'Este es un producto destacado dentro de nuestro catálogo. Próximamente aquí aparecerá una descripción generada automáticamente por el asistente inteligente.',
                    })),
                  },
                ])
              }
            } catch (err) {
              setMessages(prev => [
                ...prev,
                {
                  role: 'bot',
                  text: `❌ No se encontró un cliente con ese ID. (${err})`,
                },
              ])
            }
          }
          break

        case 'ver_mas_producto':
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              text: "Aquí iría la lógica de 'ver más producto' 🔍",
            },
          ])
          break

        case 'recomendaciones_producto':
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              text: 'Aquí iría la lógica para dar recomendaciones de producto 💡',
            },
          ])
          break

        case 'buscar_por_descripcion':
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              text: `Buscando productos que coincidan con: "${entities.descripcion}" 🔎`,
            },
          ])
          break

        default:
          setMessages(prev => [
            ...prev,
            { role: 'bot', text: 'No entendí la petición 🤔' },
          ])
      }
    } catch (err) {
      console.error('Error detectando intención:', err)
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: '❌ Error procesando tu mensaje.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const [darkMode, setDarkMode] = useDarkMode()

  const formatCustomerId = (id: string) => {
    return `600833......${id.padStart(7, '0')}`
  }

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

          {/* Cliente identificado */}
          {customer && (
            <div className="flex flex-col items-end text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-full">
                  <User size={16} />
                </span>
                <span className="font-semibold">
                  {customer.first_name} {customer.last_name}
                </span>
              </div>
              <span className="text-xs opacity-80">
                {formatCustomerId(customer.customer_id)}
              </span>
            </div>
          )}
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

          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <InputBox onSend={handleSend} disabled={isLoading} inputRef={inputRef} />
      </div>
    </div>
  )
}
