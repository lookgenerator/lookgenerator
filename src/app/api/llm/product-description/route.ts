// app/api/llm/product-description/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { name, category } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // 🎲 Semilla aleatoria para diversificar el output
    const randomSeed = Math.floor(Math.random() * 10000);

    const prompt = `
Eres un redactor de marketing para la tienda online de El Corte Inglés.
Tu tarea es escribir una descripción breve, única y atractiva para un producto.

Detalles del producto:
- Nombre: "${name}"
- Categoría: "${category || "sin especificar"}"

Instrucciones:
- Sé original y evita repetir estructuras comunes.
- Usa un tono natural y persuasivo, distinto cada vez.
- En moda, resalta estilo y sensaciones. 
- En electrónica, resalta innovación y utilidad. 
- En hogar o decoración, resalta confort y estética.
- Longitud máxima: 3 frases (menos de 70 palabras).
- No repitas frases entre productos.
- No uses comillas, emojis ni etiquetas HTML.
- Semilla creativa: ${randomSeed}

Ejemplos de tono:
- “Diseñado para quienes buscan comodidad y elegancia en su día a día.”
- “Tecnología avanzada que transforma la forma en que disfrutas tu tiempo libre.”
- “Combina un estilo moderno con materiales de la más alta calidad.”

Devuelve solo el texto de la descripción, sin formato adicional.
`;

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 1.1, // 🌶️ más creatividad
      top_p: 1,
      max_tokens: 100,
      presence_penalty: 0.6, // penaliza repeticiones
      frequency_penalty: 0.5,
    });

    const description = completion.choices[0].message?.content?.trim();

    return NextResponse.json({ description });
  } catch (err) {
    console.error("❌ Error generando descripción:", err);
    return NextResponse.json(
      { error: "Error generando descripción" },
      { status: 500 }
    );
  }
}
