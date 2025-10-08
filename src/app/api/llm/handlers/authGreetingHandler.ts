import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateAuthGreeting(customerName: string) {
  const randomSeed = Math.floor(Math.random() * 10000);

  const prompt = `
Eres un asistente virtual amable de una tienda online.
Tu tarea es generar un mensaje de bienvenida cuando un cliente se autentica.
Debe sonar cálido, personalizado y diferente cada vez.
Incluye el nombre del cliente si está disponible ("${customerName}").

Varía el estilo, los emojis y las frases para que no se repitan.

Ejemplos:
- "¡Hola ${customerName}! Me alegra verte de nuevo 💚"
- "¡Bienvenida otra vez, ${customerName}! ¿Lista para descubrir novedades? 🛍️"
- "¡Hey ${customerName}! Qué gusto volver a verte 😊"
- "¡Encantado de verte, ${customerName}! Te he preparado recomendaciones personalizadas 🔎"

No incluyas comillas ni texto adicional. Solo devuelve el saludo.
Semilla de variación: ${randomSeed}
`;

  const completion = await client.chat.completions.create({
    model: process.env.MODEL || "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    temperature: 1,
    top_p: 1,
    presence_penalty: 0.6,
    frequency_penalty: 0.5,
    max_tokens: 80,
  });

  const greeting = completion.choices[0].message?.content?.trim();
  return greeting || `¡Hola ${customerName}! Encantado de verte 😊`;
}
