import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateGreeting(message: string) {
  const prompt = `
Eres un asistente virtual de una tienda online.
Genera un saludo breve, natural y diferente cada vez que el usuario salude.
El saludo debe sonar humano, cercano y positivo.

Si el mensaje contiene un nombre, usa ese nombre en el saludo.
Varía el estilo y la estructura en cada respuesta (usa diferentes expresiones, emojis y formas de saludo).

Ejemplos variados:
- "¡Hola Laura! Qué gusto verte por aquí 😊"
- "¡Buenas, Laura! Encantado de saludarte 👋"
- "¡Hey! Me alegra verte de nuevo 😄"
- "¡Hola! Espero que estés teniendo un gran día ☀️"
- "¡Qué alegría verte, Laura! 💚"

No repitas exactamente el mismo saludo en distintas llamadas.
Solo devuelve el texto del saludo, sin comillas ni etiquetas adicionales.
`;

  const completion = await client.chat.completions.create({
    model: process.env.MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message },
    ],
    temperature: 1,   // 🔥 más creatividad
    top_p: 1,         // 🔀 máxima diversidad controlada
    presence_penalty: 0.6, // 🚫 evita repetir frases o emojis
    frequency_penalty: 0.5,
    max_tokens: 60,
  });

  const greeting = completion.choices[0].message?.content?.trim();

  return greeting || "¡Hola! Encantado de saludarte 😊";
}
