// app/api/llm/welcome-message/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  try {
    const randomSeed = Math.floor(Math.random() * 10000);

    const prompt = `
Eres el asistente virtual de El Corte Inglés.
Debes generar un mensaje de bienvenida breve, profesional y sin emojis.

Instrucciones:
- El mensaje debe sonar natural, cercano y humano.
- Indica de forma clara que el usuario puede:
  1. Buscar un producto escribiendo su descripción.
  2. Identificarse como cliente indicando su número de cliente.
- No uses emojis ni signos decorativos.
- Sé directo (máximo 2 frases).
- Genera pequeñas variaciones entre ejecuciones usando la semilla ${randomSeed}.

Ejemplo:
"Hola, soy el asistente virtual de El Corte Inglés. Puedes buscar un producto escribiendo su descripción o identificarte con tu número de cliente."
`;

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
      max_tokens: 80,
    });

    const message =
      completion.choices[0].message?.content?.trim() ||
      "Hola, soy el asistente virtual de El Corte Inglés. Puedes buscar un producto escribiendo su descripción o identificarte con tu número de cliente.";

    return NextResponse.json({ message });
  } catch (err) {
    console.error("❌ Error en /api/llm/welcome-message:", err);
    return NextResponse.json(
      {
        message:
          "Hola, soy el asistente virtual de El Corte Inglés. Puedes buscar un producto escribiendo su descripción o identificarte con tu número de cliente.",
      },
      { status: 500 }
    );
  }
}
