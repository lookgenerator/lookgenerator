// app/api/llm/generate-look/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { apiFetch } from "@/app/lib/api/client";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Cache de valores de catálogo
let cachedValues: Record<string, string[]> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 horas

async function getCachedValues() {
  const now = Date.now();
  if (cachedValues && now - lastFetchTime < CACHE_TTL) return cachedValues;

  console.log("♻️ Refrescando valores de catálogo...");

  try {
    const [colours, categories, subcategories, articletype, genders, usages, seasons] = await Promise.all([
      apiFetch<{ values: string[] }>("/products/values/basecolour"),
      apiFetch<{ values: string[] }>("/products/values/mastercategory"),
      apiFetch<{ values: string[] }>("/products/values/subcategory"),
      apiFetch<{ values: string[] }>("/products/values/articletype"),
      apiFetch<{ values: string[] }>("/products/values/gender"),
      apiFetch<{ values: string[] }>("/products/values/usage"),
      apiFetch<{ values: string[] }>("/products/values/season"),
    ]);

    cachedValues = {
      basecolour: colours.values,
      mastercategory: categories.values,
      subcategory: subcategories.values,
      articletype: articletype.values,
      gender: genders.values,
      usage: usages.values,
      season: seasons.values,
    };
    lastFetchTime = now;
  } catch (err) {
    console.error("❌ Error al obtener valores de catálogo:", err);
    cachedValues = {
      basecolour: ["Black", "White", "Blue", "Red", "Beige"],
      mastercategory: ["Apparel", "Accessories", "Footwear"],
      subcategory: ["Tshirt", "Jeans", "Shoes", "Bag", "Watch"],
      articletype: ["Belts", "Jeans", "Watches"],
      gender: ["Men", "Women", "Unisex"],
      usage: ["Casual", "Formal", "Sports"],
      season: ["Summer", "Winter", "All"],
    };
  }

  return cachedValues!;
}

export async function POST(req: Request) {
  try {
    const { productName, category } = await req.json();
    if (!productName) {
      return NextResponse.json(
        { error: "El nombre del producto es obligatorio" },
        { status: 400 }
      );
    }

    const values = await getCachedValues();
    const randomSeed = Math.floor(Math.random() * 10000);

    const prompt = `
Eres un **estilista digital** de El Corte Inglés.
Tu tarea es generar un **look completo** a partir de una prenda base.

### Producto base
- Nombre: "${productName}"
- Categoría: "${category || "sin especificar"}"

### Instrucciones
1. Sugiere entre 2 y 4 artículos complementarios que combinen con el producto base.
2. Para cada artículo sugerido, genera también un conjunto de **filtros de búsqueda** adecuados según el catálogo real (campos: subcategory, basecolour, gender, usage, season).
3. Usa **solo** valores de estas listas permitidas:

   - basecolour: ${values.basecolour.slice(0, 15).join(", ")}
   - mastercategory: ${values.mastercategory.slice(0, 20).join(", ")}
   - subcategory: ${values.subcategory.slice(0, 20).join(", ")}
   - articletype: ${values.articletype.slice(0, 20).join(", ")}
   - gender: ${values.gender.join(", ")}
   - usage: ${values.usage.join(", ")}
   - season: ${values.season.join(", ")}

4. Devuelve **únicamente un JSON válido** con esta estructura exacta:
{
  "estilo": "nombre del estilo (ej. Casual elegante)",
  "descripcion_general": "breve descripción del look",
  "articulos": [
    {
      "tipo": "nombre del tipo (ej. Camisa, Pantalón)",
      "nombre_sugerido": "nombre corto del artículo sugerido",
      "filtros": {
        "mastercategory": "...",
        "subcategory": "...",
        "articletype": "...",
        "basecolour": "...",
        "gender": "...",
        "usage": "...",
        "season": "..."
      }
    }
  ]
}
5. No escribas texto adicional fuera del JSON.
6. Semilla creativa: ${randomSeed}.
`;

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 1,
      max_tokens: 600,
    });

    const content = completion.choices[0].message?.content?.trim() || "{}";

    // 🧠 --- Mostrar la respuesta cruda del LLM ---
    try {
      console.log("🧾 RAW LLM OUTPUT:\n", JSON.stringify(JSON.parse(content), null, 2));
    } catch {
      console.log("🧾 RAW LLM OUTPUT (texto sin parsear):\n", content);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("⚠️ Respuesta no JSON, devolviendo fallback básico.");
      parsed = {
        estilo: "Casual moderno",
        descripcion_general: content,
        articulos: [],
      };
    }

    // Validación rápida: asegurar estructura mínima
    if (!parsed.articulos || !Array.isArray(parsed.articulos)) {
      parsed.articulos = [];
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("❌ Error en /api/llm/generate-look:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
