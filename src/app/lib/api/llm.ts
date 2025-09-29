// lib/api/llm.ts
type Intent =
  | "identificar_usuario"
  | "ver_mas_producto"
  | "recomendaciones_producto"
  | "buscar_por_descripcion"
  | "saludo"
  | "desconocido";

export interface IntentResult {
  intent: Intent;
  entities: Record<string, string | number | boolean>;
}

// lib/api/llm.ts
export async function detectIntent(message: string) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("Error llamando a /api/llm");
  }

  return res.json();
}
