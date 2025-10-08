import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateGreeting } from './handlers/greetingHandler'
import { generateAuthGreeting } from './handlers/authGreetingHandler'

console.log('⚡️ /api/llm ROUTE ejecutándose en servidor...')

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const prompt = `
Eres un clasificador de intenciones para un chatbot de e-commerce.
Tu única salida debe ser un JSON válido con el formato:
{"intent": "...", "entities": {...}}

Intenciones posibles:
- identificar_usuario → cuando el usuario escribe un número de cliente (ej: "soy 12345")
- ver_mas_producto → cuando pide ver más detalles de un producto
- recomendaciones_producto → cuando pide recomendaciones iguales a un producto
- buscar_por_descripcion → cuando quiere buscar algo por descripción (ej: "buscar zapatillas rojas")
- saludo → cuando el usuario saluda (ej: "hola", "buenas")
- desconocido → si no encaja con nada

Ejemplos:
Usuario: "hola"  
Respuesta: {"intent":"saludo","entities":{}}

Usuario: "soy el cliente 12345"  
Respuesta: {"intent":"identificar_usuario","entities":{"customer_id":"12345"}}

Usuario: "buscar zapatillas rojas"  
Respuesta: {"intent":"buscar_por_descripcion","entities":{"descripcion":"zapatillas rojas"}}

Mensaje del usuario: "${message}"
`

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || 'no asignado',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    })

    const raw = completion.choices[0].message?.content?.trim() || '{}'

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('❌ No se pudo parsear:', raw)
      parsed = { intent: 'desconocido', entities: {} }
    }

    // 2️⃣ --- SI ES UN SALUDO, GENERAMOS RESPUESTA PERSONALIZADA ---
    if (parsed.intent === 'saludo') {
      const greeting = await generateGreeting(message)
      return NextResponse.json({
        intent: parsed.intent,
        response: greeting,
        entities: parsed.entities,
      })
    }
    // 2️⃣ --- SI ES IDENTIFICACIÓN DE USUARIO, GENERAMOS SALLUDO PERSONALIZADO ---
    if (
      parsed.intent === 'identificar_usuario' &&
      parsed.entities?.customer_id
    ) {
      const customerName = parsed.entities?.customer_name || ''
      const greeting = await generateAuthGreeting(customerName)

      return NextResponse.json({
        intent: parsed.intent,
        response: greeting,
        entities: parsed.entities,
      })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('❌ Error en /api/llm:', err)
    return NextResponse.json(
      { intent: 'desconocido', entities: {}, error: 'internal' },
      { status: 500 }
    )
  }
}
