import OpenAI from "openai";
import Jimp from "jimp";
import * as PImage from "pureimage";
import stream from "stream";
import type { Uploadable } from "openai/uploads";

// === Tipos básicos ===
type LambdaEvent = { body?: string | Record<string, unknown> };
type LambdaResponse = { statusCode: number; body: string };

// === Inicializa el cliente OpenAI ===
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// === Helper: descarga de imágenes con fallback y conversión forzada a JPG ===
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    // Proxy forzando salida JPEG (maneja WebP/AVIF)
    const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(
      url
    )}&output=jpg`;

    const res = await fetch(proxied, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        Accept: "image/jpeg,image/png,image/*,*/*;q=0.8",
      },
    });

    if (res.ok) {
      console.log(`📥 Imagen descargada correctamente (${url})`);
      return Buffer.from(await res.arrayBuffer());
    } else {
      console.warn(`⚠️ Error HTTP ${res.status} al descargar ${url}`);
    }
  } catch (err) {
    console.warn(`⚠️ Error directo al descargar ${url}:`, err);
  }

  console.warn(`🚫 No se pudo descargar la imagen: ${url}`);
  return null;
}

// === Helper: lectura segura y conversión (con logs detallados) ===
async function safeReadImage(buffer: Buffer, imageUrl: string): Promise<Jimp> {
  const lower = imageUrl.toLowerCase();
  const header = buffer.slice(0, 12).toString("hex");

  console.log(`🔍 Procesando imagen: ${imageUrl}`);
  console.log(`   → Cabecera: ${header.slice(0, 16)}...`);
  console.log(`   → Tamaño del buffer: ${buffer.length} bytes`);

  const isJPEG =
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    buffer.slice(0, 3).toString("hex") === "ffd8ff";

  if (isJPEG) {
    console.log("🟢 Formato detectado: JPEG. Leyendo directamente con Jimp...");
    try {
      const img = await Jimp.read(buffer);
      console.log("✅ Imagen JPEG leída correctamente con Jimp.");
      return img;
    } catch (err) {
      console.error("❌ Error al leer JPEG con Jimp:", err);
      throw err;
    }
  }

  console.log("🟠 Formato no JPEG detectado. Intentando conversión con pureimage...");

  try {
    const readable = new stream.PassThrough();
    readable.end(buffer);

    const img = await PImage.decodePNGFromStream(readable);
    const canvas = PImage.make(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const outStream = new stream.PassThrough();
    await PImage.encodeJPEGToStream(canvas, outStream, 90);
    const chunks: Buffer[] = [];
    for await (const chunk of outStream) chunks.push(chunk);
    const jpegBuffer = Buffer.concat(chunks);

    console.log(`💾 Imagen convertida correctamente con pureimage (${jpegBuffer.length} bytes)`);

    const final = await Jimp.read(jpegBuffer);
    console.log("✅ Imagen JPEG leída correctamente después de conversión.");
    return final;
  } catch (err) {
    console.error("❌ Error durante conversión con pureimage:", err);
    console.warn("   → Intentando lectura directa con Jimp...");
    return await Jimp.read(buffer);
  }
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
      if (buf) buffers.push(buf);
    }

    if (buffers.length === 0) {
      throw new Error("No se pudo descargar ninguna imagen válida.");
    }

    console.log("🧠 Iniciando lectura y combinación de imágenes...");
    const targetHeight = 400;
    const images = await Promise.all(
      buffers.map((b, i) => safeReadImage(b, products[i].image_url))
    );

    for (const img of images) {
      const aspect = img.bitmap.width / img.bitmap.height;
      const newWidth = Math.round(targetHeight * aspect);
      img.resize(newWidth, targetHeight);
    }

    const totalWidth = images.reduce((acc, img) => acc + img.bitmap.width, 0);
    const combined: Jimp = await new Jimp(totalWidth, targetHeight, 0xffffffff);

    let offsetX = 0;
    for (const img of images) {
      combined.composite(img, offsetX, 0);
      offsetX += img.bitmap.width;
    }

    const combinedBuffer: Buffer = await new Promise((resolve, reject) => {
      combined.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
        if (err || !buffer) reject(err);
        else resolve(buffer);
      });
    });

    console.log(
      `🧩 Imágenes combinadas correctamente. Tamaño final: ${combinedBuffer.length} bytes`
    );

    const combinedBase64 = `data:image/jpeg;base64,${combinedBuffer.toString(
      "base64"
    )}`;

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

    console.log("✅ Imagen generada correctamente por OpenAI.");

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
