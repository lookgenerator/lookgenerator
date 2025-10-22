'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Message from './Message'
import InputBox from './InputBox'
import TypingIndicator from './TypingIndicator'
import useDarkMode from '../hooks/useDarkMode'
import { Moon, Sun } from 'lucide-react'
import { getSimilarProducts } from '../lib/api/products'
import type { MessageItem, ChatProduct } from '../lib/types/chat'
import { getCustomerById } from '../lib/api/client'
import type { Customer } from '../lib/types/customer'
import { User } from 'lucide-react'
import { detectIntent } from '../lib/api/llm'
import type { ProductFilter } from '@/app/lib/types/product'

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
                    text: `Como has comprado o visualizado ${baseProduct.name}, voy a buscarte recomendaciones similares. `,
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

  // 👋 Pantalla de bienvenida
  const [showIntro, setShowIntro] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  const handleStart = async () => {
    setFadeOut(true)

    // Espera a que se desvanezca la intro
    setTimeout(async () => {
      setShowIntro(false)

      // 🔸 Muestra indicador de escritura
      setIsLoading(true)

      try {
        // Llamada al LLM
        const res = await fetch('/api/llm/welcome-message')
        const data = await res.json()

        // Simular un pequeño retardo para realismo
        setTimeout(() => {
          setIsLoading(false)
          setMessages([
            {
              role: 'bot',
              text: data.message,
            },
          ])
        }, 1000)
      } catch (err) {
        console.error('❌ Error obteniendo saludo inicial:', err)
        setIsLoading(false)
        setMessages([
          {
            role: 'bot',
            text: 'Hola, soy el asistente virtual de El Corte Inglés. Puedes buscar un producto escribiendo su descripción o identificarte con tu número de cliente.',
          },
        ])
      }
    }, 700) // ⏱️ tiempo sincronizado con el fadeOut
  }

  const handleFindSimilar = async (product: ChatProduct) => {
    // 1️⃣ Mensaje inicial
    setMessages(prev => [
      ...prev,
      {
        role: 'bot',
        text: `Buscando productos similares a ${product.name} 🔎`,
        product,
      },
    ])

    setIsLoading(true)

    // 3️⃣ Obtener productos similares desde la API
    const data = await getSimilarProducts(product.id)

    // 4️⃣ Enriquecer descripciones
    const enriched = await Promise.all(
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
              d.description || 'Descripción no disponible por el momento.',
          }
        } catch {
          return {
            id: p.product_id,
            name: p.name,
            image_url: p.image_url,
            score: p.score,
            description: 'Descripción no disponible.',
          }
        }
      })
    )

    setIsLoading(false)

    // 5️⃣ Mostrar lista de similares
    setMessages(prev => [
      ...prev,
      {
        role: 'bot',
        text: `Productos similares a ${product.name}:`,
        products: enriched,
      },
    ])
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
      <div
        className="
  relative z-10 flex flex-col w-full max-w-md h-[90vh] sm:h-[850px]
  bg-white/40 dark:bg-gray-800/30
  backdrop-blur-xl
  rounded-2xl shadow-2xl overflow-hidden
  border border-white/30 dark:border-gray-700/50
  transition-all duration-700
  mx-2 sm:mx-0
"
      >
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
          className="
    flex-1 overflow-y-auto p-4
    bg-white/20 dark:bg-gray-900/20
    backdrop-blur-md
    transition-all duration-500
  "
          style={{
            background:
              'linear-gradient(to bottom right, rgba(255,255,255,0.3), rgba(200,255,200,0.1))',
          }}
        >
          {messages.map((m, i) => (
            <Message
              key={i}
              role={m.role}
              text={m.text}
              product={m.product}
              products={m.products}
              onFindSimilar={handleFindSimilar}
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

        {/* 🌟 Pantalla de bienvenida */}
        {showIntro && (
          <div
            className={`
      absolute inset-0 z-50 flex flex-col items-center justify-center
      bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg text-center
      transition-opacity duration-700
      ${fadeOut ? 'opacity-0' : 'opacity-100'}
    `}
          >
            <div className="max-w-sm p-6 rounded-2xl shadow-lg bg-white/70 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">
                ¡Bienvenido!
              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Soy el <strong>Asistente Virtual de El Corte Inglés</strong>
              </p>

              {/* 🟢 Logo El Corte Inglés */}
              <div className="flex justify-center mb-5">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/0/02/Logo_Corte_Ingl%C3%A9s.svg"
                  alt="Logo El Corte Inglés"
                  width={130}
                  height={50}
                  className="drop-shadow-md dark:brightness-90"
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2 text-left">
                <p className="flex items-center gap-2">
                  <User
                    size={16}
                    className="text-green-600 dark:text-green-400"
                  />
                  <span>🆔 Identifícate escribiendo tu número de cliente.</span>
                </p>
                <p>🔎 Busca un producto escribiendo su descripción.</p>
                <p>💡 Ejemplo: “Buscar zapatillas rojas”.</p>
              </div>

              <button
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow transition-all duration-300"
              >
                Comenzar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
