// app/api/llm/generate-look/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { apiFetch } from "@/app/lib/api/client";
import type { ProductFilter } from "@/app/lib/types/product";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🧠 Cache de valores de catálogo
let cachedValues: Record<string, string[]> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 horas

async function getCachedValues() {
  const now = Date.now();
  if (cachedValues && now - lastFetchTime < CACHE_TTL) return cachedValues;

  console.log("♻️ Refrescando valores de catálogo...");
  try {
    const [colours, categories, subcategories, articletype, genders, usages, seasons] =
      await Promise.all([
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

// 🎲 Selecciona un producto aleatorio
function randomItem<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
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

    // 🧠 Prompt de generación del look
    const prompt = `
Eres un estilista digital de El Corte Inglés.
Tu tarea es generar un look completo (2–4 artículos) a partir del producto base. No recomiendes un artículo de la misma categoría que el producto base.

Producto base:
- Nombre: "${productName}"
- Categoría: "${category || "sin especificar"}"

Usa solo valores válidos del catálogo:
- basecolour: ${values.basecolour.slice(0, 15).join(", ")}
- mastercategory: ${values.mastercategory.slice(0, 20).join(", ")}
- subcategory: ${values.subcategory.slice(0, 20).join(", ")}
- articletype: ${values.articletype.slice(0, 20).join(", ")}
- gender: ${values.gender.join(", ")}
- usage: ${values.usage.join(", ")}
- season: ${values.season.join(", ")}

Devuelve solo JSON con este formato:
{
  "estilo": "...",
  "descripcion_general": "...",
  "articulos": [
    {
      "tipo": "...",
      "nombre_sugerido": "...",
      "filtros": {
        "gender": "...",
        "mastercategory": "...",
        "subcategory": "...",
        "articletype": "...",
        "basecolour": "...",
        "usage": "...",
        "season": "..."
      }
    }
  ]
}
Semilla creativa: ${randomSeed}.
`;

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 1,
      max_tokens: 600,
    });

    const content = completion.choices[0].message?.content?.trim() || "{}";
    console.log("🧾 RAW LLM OUTPUT:\n", content);

    // Intentar parsear JSON
    let parsed: {
      estilo: string;
      descripcion_general: string;
      articulos?: {
        tipo: string;
        nombre_sugerido: string;
        filtros?: Record<string, string>;
        producto?: ProductFilter | null;
      }[];
    };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { estilo: "Desconocido", descripcion_general: content, articulos: [] };
    }

    // 🧩 Buscar productos reales
    for (const art of parsed.articulos || []) {
      if (!art.filtros) continue;

      const filtrosActuales = { ...art.filtros };
      let results: ProductFilter[] = [];

      // 🔢 Orden de importancia
      const importancia = [
        "gender",
        "mastercategory",
        "subcategory",
        "articletype",
        "basecolour",
        "usage",
        "season",
      ];

      console.log(`🎯 Buscando producto para: ${art.nombre_sugerido}`);
      console.log("Filtros iniciales:", filtrosActuales);

      // 🔁 Reducir progresivamente los filtros según importancia
      while (results.length === 0 && Object.keys(filtrosActuales).length > 0) {
        const query = new URLSearchParams({ ...filtrosActuales, limit: "10" }).toString();
        const productos = await apiFetch<ProductFilter[]>(`/products/filter?${query}`);

        if (productos.length > 0) {
          results = productos;
          console.log(`✅ ${productos.length} productos encontrados.`);
          break;
        }

        // Eliminar el filtro menos importante que quede activo
        const filtrosActivos = Object.keys(filtrosActuales);
        const menosImportante = importancia
          .slice()
          .reverse()
          .find(key => filtrosActivos.includes(key));

        if (menosImportante) {
          console.log(`⚠️ Sin resultados. Eliminando filtro: ${menosImportante}`);
          delete filtrosActuales[menosImportante as keyof typeof filtrosActuales];
        } else {
          console.log("⚠️ No quedan filtros para eliminar.");
          break;
        }
      }

      // 🧩 Fallback final si aún no hay resultados
      if (results.length === 0) {
        console.warn("⚠️ Fallback final: sin resultados, usando productos aleatorios.");
        const randoms = await apiFetch<ProductFilter[]>("/products/filter?limit=10");
        results = randoms;
      }

      // 🎲 Elegir uno aleatorio
      const elegido = results.length > 0 ? randomItem(results) : null;
      art.producto = elegido;

      console.log(
        `🎯 Producto final para "${art.nombre_sugerido}":`,
        elegido ? elegido.name : "Ninguno encontrado"
      );
    }

    console.log("✅ LOOK FINAL CON PRODUCTOS:", JSON.stringify(parsed, null, 2));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("❌ Error en /api/llm/generate-look:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
