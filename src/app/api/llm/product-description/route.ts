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

    const prompt = `
Eres un asistente de marketing de la tienda online de El Corte Inglés.
Tu tarea es redactar una descripción breve y atractiva para un producto.

Detalles:
- Nombre del producto: "${name}"
- Categoría: "${category || "sin especificar"}"

Requisitos:
- Máximo 3 frases.
- Tono elegante, positivo y natural.
- Enfócate en los beneficios y el estilo del producto.
- No uses mayúsculas innecesarias ni símbolos.
- Devuelve solo el texto de la descripción, sin comillas ni formato extra.
`;

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.9,
      max_tokens: 100,
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
