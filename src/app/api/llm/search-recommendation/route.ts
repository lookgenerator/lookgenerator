import { NextResponse } from "next/server";
import OpenAI from "openai";
import { apiFetch } from "@/app/lib/api/client";
import type { ProductFilter } from "@/app/lib/types/product";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Función para obtener similitudes simples
function findSimilarValues(list: string[], target: string, maxCount = 3): string[] {
  if (!target) return [];
  const lower = target.toLowerCase();
  const matches = list.filter(
    (v) =>
      v.toLowerCase() !== lower &&
      (v.toLowerCase().startsWith(lower.slice(0, 2)) ||
        v.toLowerCase().includes(lower.slice(0, 3)))
  );
  if (matches.length === 0) {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, maxCount);
  }
  return matches.slice(0, maxCount);
}

export async function POST(req: Request) {
  try {
    const { descripcion } = await req.json();
    if (!descripcion)
      return NextResponse.json(
        { error: "El campo 'descripcion' es obligatorio." },
        { status: 400 }
      );

    console.log(`🧠 Nueva búsqueda iterativa controlada para: "${descripcion}"`);

    // 1️⃣ Obtener listas reales desde la API
    const [
      colours,
      categories,
      subcategories,
      usages,
      genders,
      articletype,
      season,
      year,
    ] = await Promise.all([
      apiFetch<{ column: string; values: string[] }>("/products/values/basecolour"),
      apiFetch<{ column: string; values: string[] }>("/products/values/mastercategory"),
      apiFetch<{ column: string; values: string[] }>("/products/values/subcategory"),
      apiFetch<{ column: string; values: string[] }>("/products/values/usage"),
      apiFetch<{ column: string; values: string[] }>("/products/values/gender"),
      apiFetch<{ column: string; values: string[] }>("/products/values/articletype"),
      apiFetch<{ column: string; values: string[] }>("/products/values/season"),
      apiFetch<{ column: string; values: (string | number)[] }>("/products/values/year"),
    ]);

    // 2️⃣ Pedimos al LLM que interprete la descripción con precisión
    const interpretPrompt = `
Eres un asistente experto en retail. 
Un usuario ha escrito: "${descripcion}" (puede estar en cualquier idioma).

Tu tarea:
1. Identifica qué valores de las listas de productos se ajustan mejor a la descripción.
2. Usa únicamente los valores listados a continuación (no inventes ni traduzcas fuera de ellos).
3. Devuelve un JSON con **máximo dos filtros**, priorizando subcategoría y color si son relevantes.
4. No incluyas texto adicional ni explicaciones.

Valores disponibles:
- basecolour: ${colours.values.join(", ")}
- subcategory: ${subcategories.values.slice(0, 40).join(", ")}
- mastercategory: ${categories.values.join(", ")}
- articletype: ${articletype.values.slice(0, 30).join(", ")}

Ejemplo: {"subcategory":"Gloves","basecolour":"Green"}.
`;

    const interpretation = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: interpretPrompt }],
      temperature: 0.5,
    });

    let filters: Record<string, string> = {};
    try {
      filters = JSON.parse(interpretation.choices[0].message?.content?.trim() || "{}");
    } catch {
      filters = {};
    }

    // Validación de seguridad: asegurarse de que los filtros están en las listas reales
    if (
      filters.basecolour &&
      !colours.values.includes(filters.basecolour)
    )
      delete filters.basecolour;

    if (
      filters.subcategory &&
      !subcategories.values.includes(filters.subcategory)
    )
      delete filters.subcategory;

    console.log(`🎯 Filtros iniciales interpretados por el LLM: ${JSON.stringify(filters)}`);

    // Si el LLM no devuelve nada válido, forzar fallback mínimo
    if (Object.keys(filters).length === 0) {
      filters = { subcategory: "Accessories" };
      console.log("⚠️ LLM no devolvió filtros válidos. Usando fallback genérico.");
    }

    const results: ProductFilter[] = [];
    const usedFilters: Record<string, Record<string, string>> = {};
    let attempts = 0;
    const maxAttempts = 6;

    // 3️⃣ Bucle de búsqueda iterativa
    while (results.length < 5 && attempts < maxAttempts) {
      attempts++;
      usedFilters[`Intento ${attempts}`] = { ...filters };

      const query = new URLSearchParams({ ...filters, limit: "15" }).toString();
      const data = await apiFetch<ProductFilter[]>(`/products/filter?${query}`);
      console.log(`🔎 Intento ${attempts}: ${JSON.stringify(filters)} → ${data.length} resultados`);

      // Acumular resultados sin duplicar
      const newOnes = data.filter(
        (p) => !results.some((r) => r.product_id === p.product_id)
      );
      results.push(...newOnes);
      console.log(`📈 Total acumulado: ${results.length} productos`);

      if (results.length >= 5) break;

      // 🎨 Probar colores o subcategorías similares
      if (filters.basecolour) {
        const similarColours = findSimilarValues(colours.values, filters.basecolour);
        for (const alt of similarColours) {
          const altFilters = { ...filters, basecolour: alt };
          const q = new URLSearchParams({ ...altFilters, limit: "15" }).toString();
          const altData = await apiFetch<ProductFilter[]>(`/products/filter?${q}`);
          console.log(`🎨 Color alternativo ${alt} → ${altData.length} resultados`);
          const newAlt = altData.filter(
            (p) => !results.some((r) => r.product_id === p.product_id)
          );
          results.push(...newAlt);
          usedFilters[`Intento ${attempts} (color ${alt})`] = altFilters;
          if (results.length >= 5) break;
        }
      }

      if (results.length >= 5) break;

      if (filters.subcategory) {
        const similarSubcats = findSimilarValues(subcategories.values, filters.subcategory);
        for (const s of similarSubcats) {
          const altFilters = { ...filters, subcategory: s };
          const q = new URLSearchParams({ ...altFilters, limit: "15" }).toString();
          const altData = await apiFetch<ProductFilter[]>(`/products/filter?${q}`);
          console.log(`🧩 Subcategoría alternativa ${s} → ${altData.length} resultados`);
          const newAlt = altData.filter(
            (p) => !results.some((r) => r.product_id === p.product_id)
          );
          results.push(...newAlt);
          usedFilters[`Intento ${attempts} (subcat ${s})`] = altFilters;
          if (results.length >= 5) break;
        }
      }
    }

    // 4️⃣ Fallback final
    if (results.length < 5) {
      console.warn("⚠️ No se alcanzó el mínimo. Recuperando genéricos.");
      const generic = await apiFetch<ProductFilter[]>("/products/filter?limit=10");
      const extras = generic.filter(
        (p) => !results.some((r) => r.product_id === p.product_id)
      );
      results.push(...extras);
      usedFilters["fallback"] = { fallback: "Búsqueda sin filtros" };
    }

    // 5️⃣ Explicación LLM
    const explainPrompt = `
Resume en una frase por qué estos productos coinciden con "${descripcion}".
`;
    const explain = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: explainPrompt }],
      temperature: 0.6,
      max_tokens: 60,
    });

    const explanation =
      explain.choices[0].message?.content?.trim() ||
      `He encontrado ${results.length} productos relacionados con "${descripcion}".`;

    return NextResponse.json({
      count: results.length,
      filters_used: usedFilters,
      results: results.slice(0, 10),
      explanation,
    });
  } catch (err) {
    console.error("❌ Error en /api/llm/search-recommendation:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
