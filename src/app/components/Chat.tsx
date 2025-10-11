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
import type { ProductFilter } from "@/app/lib/types/product";


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
      const { intent, entities, response } = await detectIntent(
        customer
          ? `Usuario autenticado: ${customer.first_name}. Mensaje: ${msg}`
          : msg
      )

      // 🔎 DEBUG solo si NEXT_PUBLIC_DEBUG = "true"
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `🛠️ Debug → Intent: **${intent}** | Entities: ${JSON.stringify(
              entities
            )}| Response: ${JSON.stringify(response)}`,
          },
        ])
      }

      switch (intent) {
        case 'saludo':
          const name = customer?.first_name ? ` ${customer.first_name}` : ''
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              text: response
                ? response
                : `👋 ¡Hola${name}! ¿En qué puedo ayudarte hoy?`,
            },
          ])
          break

        case 'identificar_usuario':
          if (entities.customer_id) {
            try {
              const customer = await getCustomerById(
                String(entities.customer_id)
              )
              setCustomer(customer)

              // 🔹 Generar saludo LLM de bienvenida personalizada
              const res = await fetch('/api/llm/auth-greeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: customer.first_name,
                }),
              })
              const { response: authGreeting } = await res.json()

              //console.log('authGreeting ', authGreeting)

              setMessages(prev => [
                ...prev,
                {
                  role: 'bot',
                  text:
                    authGreeting ||
                    `¡Hola ${customer.first_name}! Bienvenido 👋`,
                },
              ])

              if (customer.products && customer.products.length > 0) {
                const baseProduct = customer.products[0]

                // 🔹 Nueva llamada: descripción generada por el LLM
                const descRes = await fetch('/api/llm/product-description', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: baseProduct.name,
                  }),
                })
                const descData = await descRes.json()

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
                        descData.description ||
                        'Este es un producto destacado dentro de nuestro catálogo. Próximamente aquí aparecerá una descripción generada automáticamente por el asistente inteligente.',
                    },
                  },
                ])

                const data = await getSimilarProducts(baseProduct.product_id)

                // Generar descripción para el primer producto similar
                const enrichedProducts = await Promise.all(
                  data.neighbors.map(async p => {
                    try {
                      const r = await fetch('/api/llm/product-description', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: p.name,
                        }),
                      })
                      const d = await r.json()
                      return {
                        id: p.product_id,
                        name: p.name,
                        image_url: p.image_url,
                        score: p.score,
                        description:
                          d.description ||
                          'Descripción no disponible en este momento.',
                      }
                    } catch {
                      return {
                        id: p.product_id,
                        name: p.name,
                        image_url: p.image_url,
                        score: p.score,
                        description:
                          'Descripción no disponible por el momento.',
                      }
                    }
                  })
                )

                setMessages(prev => [
                  ...prev,
                  {
                    role: 'bot',
                    text: `Productos similares a ${baseProduct.name}:`,
                    products: enrichedProducts,
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
          try {
            const descripcion = entities.descripcion as string

            // 🧠 mensaje inicial
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                text: `Buscando productos que coincidan con: "${descripcion}" 🔎`,
              },
            ])

            // 🔍 Llamada al nuevo endpoint inteligente de búsqueda
            const res = await fetch('/api/llm/search-recommendation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ descripcion }),
            })

            if (!res.ok) {
              throw new Error(
                `Error en /api/llm/search-recommendation: ${res.status}`
              )
            }

            const { results, explanation } = await res.json()

            if (!results || results.length === 0) {
              setMessages(prev => [
                ...prev,
                {
                  role: 'bot',
                  text: `No he encontrado productos que coincidan con "${descripcion}". 😔`,
                },
              ])
              break
            }

            // ✨ Enriquecer cada producto con una descripción generada por el LLM
            const enrichedProducts = await Promise.all(
              results.slice(0, 5).map(async (p: ProductFilter) => {
                try {
                  const descRes = await fetch('/api/llm/product-description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: p.name,
                      category: p.category,
                    }),
                  })

                  const descData = await descRes.json()

                  return {
                    id: p.product_id,
                    name: p.name,
                    image_url: p.image_url,
                    category: p.category,
                    description:
                      descData.description ||
                      'Descripción no disponible en este momento.',
                  }
                } catch (err) {
                  console.error('❌ Error generando descripción:', err)
                  return {
                    id: p.product_id,
                    name: p.name,
                    image_url: p.image_url,
                    category: p.category,
                    description: 'Descripción no disponible.',
                  }
                }
              })
            )

            // 🗣️ Mensaje explicativo del LLM
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                text:
                  explanation ||
                  'He encontrado algunos artículos que podrían interesarte 👇',
              },
            ])

            // 🛍️ Mostrar los productos encontrados en carrusel
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                text: '',
                products: enrichedProducts,
              },
            ])
          } catch (err) {
            console.error('❌ Error procesando búsqueda por descripción:', err)
            setMessages(prev => [
              ...prev,
              {
                role: 'bot',
                text: 'Ha ocurrido un error al procesar tu búsqueda. Inténtalo de nuevo más tarde.',
              },
            ])
          }
          
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
  <div
    className="
      relative flex items-center justify-center h-screen overflow-hidden
      bg-gradient-to-br from-green-50 via-blue-50 to-white
      dark:from-gray-900 dark:via-gray-800 dark:to-black
    "
  >
    {/* ✨ Capa de textura translúcida */}
    <div
      className="
        absolute inset-0 
        bg-[url('https://www.transparenttextures.com/patterns/symphony.png')] 
        dark:bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]
        opacity-20 dark:opacity-15
        pointer-events-none
      "
    />

    {/* 💫 Capa de luces difusas */}
    <div
      className="
        absolute inset-0 
        bg-[radial-gradient(circle_at_top_left,_#22c55e40,_transparent_60%),radial-gradient(circle_at_bottom_right,_#2563eb40,_transparent_60%)]
        dark:bg-[radial-gradient(circle_at_top_left,_#22c55e55,_transparent_60%),radial-gradient(circle_at_bottom_right,_#1e3a8a55,_transparent_60%)]
        animate-pulseBackground blur-[2px]
        pointer-events-none
      "
    />

    {/* 💬 Contenedor principal del chat */}
    <div className="relative z-10 flex flex-col w-full max-w-md h-[850px] bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden border border-white/20 dark:border-gray-700">

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

          {/* 🧹 Botón limpiar caché, visible solo en modo debug */}
          {process.env.NEXT_PUBLIC_DEBUG === 'true' && (
            <button
              onClick={() => {
                const confirmClear = confirm(
                  '¿Seguro que quieres borrar todas las descripciones LLM guardadas?'
                )
                if (confirmClear) {
                  const keys = Object.keys(localStorage).filter(k =>
                    k.startsWith('product_desc_')
                  )
                  keys.forEach(k => localStorage.removeItem(k))
                  alert(`🧹 Caché LLM eliminada (${keys.length} items)`)
                }
              }}
              className="ml-2 bg-white/20 text-xs px-2 py-1 rounded hover:bg-white/30 transition"
            >
              Limpiar caché LLM
            </button>
          )}
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
        <InputBox
          onSend={handleSend}
          disabled={isLoading}
          inputRef={inputRef}
        />
      </div>
    </div>
  )
}
