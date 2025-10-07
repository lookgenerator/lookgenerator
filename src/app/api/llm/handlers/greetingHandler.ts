import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateGreeting(message: string) {
  const randomSeed = Math.floor(Math.random() * 10000);

  const prompt = `
Eres un asistente virtual amable de una tienda online.
Si el usuario está autenticado y el mensaje indica su nombre (ejemplo: "Usuario autenticado: Laura"), debes saludarlo usando su nombre.
Si no hay nombre, genera un saludo general, breve, natural y diferente cada vez.
El saludo debe sonar humano, positivo y cercano.

Varía el estilo y estructura en cada respuesta (usa distintos emojis o frases).

Ejemplos:
- "¡Hola Laura! Qué gusto verte 😊"
- "¡Buenas, Laura! Encantado de saludarte 👋"
- "¡Hola! Me alegra verte por aquí 😄"
- "¡Hey! Espero que estés teniendo un gran día ☀️"

Solo devuelve el texto del saludo. No incluyas nada más.
Semilla de variación: ${randomSeed}
`;

  const completion = await client.chat.completions.create({
    model: process.env.MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message },
    ],
    temperature: 1,
    top_p: 1,
    presence_penalty: 0.6,
    frequency_penalty: 0.5,
    max_tokens: 60,
  });

  const greeting = completion.choices[0].message?.content?.trim();
  return greeting || "¡Hola! Encantado de saludarte 😊";
}
