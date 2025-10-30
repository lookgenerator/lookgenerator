import OpenAI from "openai";
import Jimp from "jimp";
import * as fs from "fs";
import path from "path";
import type { Uploadable } from "openai/uploads";

// === Tipos básicos ===
type LambdaEvent = { body?: string | Record<string, unknown> };
type LambdaResponse = { statusCode: number; body: string };

// === Inicializa el cliente OpenAI ===
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// === Helper: descarga de imágenes con fallback ===
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {}

  for (const proxy of [
    (u: string) => `https://r.jina.ai/${u}`,
    (u: string) => `https://images.weserv.nl/?url=${encodeURIComponent(u)}`,
  ]) {
    try {
      const proxied = proxy(url);
      const r = await fetch(proxied);
      if (r.ok) return Buffer.from(await r.arrayBuffer());
    } catch {}
  }

  console.warn(`⚠️ No se pudo descargar la imagen: ${url}`);
  return null;
}

// === Handler principal ===
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { products } = (body || {}) as {
      products?: { image_url: string }[];
    };

    if (!products || products.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No se proporcionaron imágenes de productos.",
        }),
      };
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

    if (buffers.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No se pudo descargar ninguna imagen válida.",
        }),
      };
    }

    // === Combinar imágenes horizontalmente ===
    const targetHeight = 400;
    const images = await Promise.all(buffers.map((b) => Jimp.read(b)));

    for (const img of images) {
      const aspect = img.bitmap.width / img.bitmap.height;
      const newWidth = Math.round(targetHeight * aspect);
      img.resize(newWidth, targetHeight);
    }

    const totalWidth = images.reduce((acc, img) => acc + img.bitmap.width, 0);
// Crear lienzo en blanco
const combined: Jimp = await new Jimp(totalWidth, targetHeight, 0xffffffff);

// Combinar imágenes horizontalmente
let offsetX = 0;
for (const img of images) {
  combined.composite(img, offsetX, 0);
  offsetX += img.bitmap.width;
}

// Exportar como buffer JPEG
const combinedBuffer: Buffer = await new Promise((resolve, reject) => {
  combined.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
    if (err || !buffer) reject(err);
    else resolve(buffer);
  });
});

    const combinedBase64 = `data:image/jpeg;base64,${combinedBuffer.toString("base64")}`;
    console.log("✅ Imágenes combinadas correctamente.");

    // === Prompt para GPT Image ===
    const prompt = `
Fotografía de moda capturada a distancia (plano general),
mostrando una figura humana completa dentro del encuadre cuadrado.
La persona viste las prendas de la imagen de referencia.
El fondo es neutro y la iluminación suave.
Alta resolución, sin texto ni logotipos.
`;

    console.log("🎨 Enviando imagen a OpenAI...");

    const file = new File([new Uint8Array(combinedBuffer)], "look.jpg", {
      type: "image/jpeg",
    });

    const response = await client.images.edit({
      model: "gpt-image-1",
      prompt,
      image: file,
      size: "1024x1024",
      n: 1,
    });

    const imageData = response.data?.[0];
    if (!imageData) throw new Error("No se recibió ninguna imagen generada.");

    console.log("✅ Imagen generada correctamente desde OpenAI.");

    return {
      statusCode: 200,
      body: JSON.stringify({
        image_url: imageData.url ?? null,
        base64: imageData.b64_json ?? null,
        combined_preview: combinedBase64,
        description:
          "Imagen generada por IA: modelo vistiendo el look completo. Incluye vista previa de combinación.",
      }),
    };
  } catch (err) {
    console.error("❌ Error generando imagen del look:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error interno al generar la imagen del look.",
        details: String(err),
      }),
    };
  }
};
