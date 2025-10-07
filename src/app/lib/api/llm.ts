// lib/api/llm.ts
export type Intent =
  | "identificar_usuario"
  | "ver_mas_producto"
  | "recomendaciones_producto"
  | "buscar_por_descripcion"
  | "saludo"
  | "desconocido";

export interface IntentResult {
  intent: Intent;
  entities: Record<string, string | number | boolean>;
  response?: string; // ← añadimos el campo opcional generado por el LLM
  error?: string;    // ← opcional para capturar errores del backend
}

export async function detectIntent(message: string): Promise<IntentResult> {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("Error llamando a /api/llm");
  }

  // El backend puede devolver también `response`
  const data = await res.json();
  return data as IntentResult;
}
