import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import fetch from "node-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🔧 Helper para descargar imágenes con cabeceras y proxies
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    // 1️⃣ Intento directo con cabeceras de navegador
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.google.com/",
      },
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {}

  try {
    // 2️⃣ Proxy alternativo Jina AI
    const jinaProxy = `https://r.jina.ai/${url}`;
    const r2 = await fetch(jinaProxy);
    if (r2.ok) return Buffer.from(await r2.arrayBuffer());
  } catch {}

  try {
    // 3️⃣ Proxy Weserv
    const wsProxy = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    const r3 = await fetch(wsProxy);
    if (r3.ok) return Buffer.from(await r3.arrayBuffer());
  } catch {}

  console.warn(`⚠️ No se pudo descargar la imagen: ${url}`);
  return null;
}

export async function POST(req: Request) {
  try {
    const { products } = await req.json();
    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron imágenes de productos." },
        { status: 400 }
      );
    }

    console.log(`🧩 Descargando ${products.length} imágenes...`);
    const buffers: Buffer[] = [];

    for (const p of products) {
      const buf = await fetchImageBuffer(p.image_url);
      if (buf) {
        buffers.push(buf);
        console.log(`✅ Imagen descargada: ${p.image_url}`);
      } else {
        console.warn(`⚠️ No se pudo descargar: ${p.image_url}`);
      }
    }

    if (buffers.length === 0)
      return NextResponse.json(
        { error: "No se pudo descargar ninguna imagen válida." },
        { status: 400 }
      );

    // === 2️⃣ Combinar imágenes con sharp ===
    const targetHeight = 400;

    const resized = await Promise.all(
      buffers.map(async (b) => {
        const meta = await sharp(b).metadata();
        const width = Math.round(
          ((meta.width || targetHeight) * targetHeight) /
            (meta.height || targetHeight)
        );
        return sharp(b).resize(width, targetHeight).toBuffer();
      })
    );

    // Obtener metadatos reales
    const metadataList = await Promise.all(resized.map((img) => sharp(img).metadata()));

    // Calcular ancho total
    const combinedWidth = metadataList.reduce(
      (acc, m) => acc + (m.width || 400),
      0
    );

    // Combinar horizontalmente
    const combined = await sharp({
      create: {
        width: combinedWidth,
        height: targetHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite(
        resized.map((img, i) => ({
          input: img,
          top: 0,
          left: metadataList
            .slice(0, i)
            .reduce((sum, m) => sum + (m.width || 400), 0),
        }))
      )
      .jpeg()
      .toBuffer();

    console.log("✅ Imágenes combinadas correctamente.");

    // Generar Base64 para previsualización
    const combinedBase64 = `data:image/jpeg;base64,${combined.toString("base64")}`;

    // === 3️⃣ Prompt para gpt-image-1 ===
    const prompt = `
    Fotografía de moda capturada a distancia (plano general),
mostrando una figura humana completa de pies a cabeza dentro del encuadre cuadrado.
La persona viste las prendas de la imagen de referencia.
El fondo es neutro y la iluminación suave.
Alta resolución, sin texto ni logotipos.
`;

    // === 4️⃣ Convertir buffer en File ===
    const file = new File([new Uint8Array(combined)], "look.jpg", {
      type: "image/jpeg",
    });

    // === 5️⃣ Llamar al modelo gpt-image-1 ===

    console.log("🎨 Generando imagen con gpt-image-1...");
    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: file,
      size: "1024x1024",
      n: 1,
    });

    const imageData = response.data?.[0];
    if (!imageData) throw new Error("No se recibió ninguna imagen generada.");

    console.log("✅ Imagen generada correctamente.");

    return NextResponse.json({
      image_url: imageData.url ?? null,
      base64: imageData.b64_json ?? null,
      combined_preview: combinedBase64, // 👈 devolvemos la imagen combinada
      description:
        "Imagen generada por IA: modelo vistiendo el look completo. Incluye vista previa de combinación.",
    });
  } catch (err) {
    console.error("❌ Error generando imagen del look:", err);
    return NextResponse.json(
      { error: "Error interno al generar la imagen del look." },
      { status: 500 }
    );
  }
}
