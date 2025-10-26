// app/api/llm/generate-look/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { productName, category } = await req.json();

    if (!productName) {
      return NextResponse.json(
        { error: "El nombre del producto es obligatorio" },
        { status: 400 }
      );
    }

    const randomSeed = Math.floor(Math.random() * 10000);

    const prompt = `
Eres un estilista de moda que trabaja para El Corte Inglés.
Tu tarea es sugerir un **look completo** a partir de una prenda o producto base.

Detalles del producto base:
- Nombre: "${productName}"
- Categoría: "${category || "sin especificar"}"

Instrucciones:
1. Propón entre **2 y 4 artículos complementarios** (ropa, calzado o accesorios) que combinen con el producto base.
2. Indica el estilo general del look (por ejemplo: casual, elegante, deportivo, etc.).
3. Devuelve la respuesta en formato **JSON** con el siguiente esquema:
{
  "estilo": "...",
  "descripcion_general": "...",
  "articulos": [
    {"tipo": "...", "nombre_sugerido": "..."},
    ...
  ]
}
4. No incluyas texto adicional fuera del JSON.
5. Genera variaciones ligeras según la semilla aleatoria: ${randomSeed}.
    `;

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 1,
      max_tokens: 300,
    });

    const content = completion.choices[0].message?.content?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { estilo: "Desconocido", descripcion_general: content, articulos: [] };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("❌ Error en /api/llm/generate-look:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
