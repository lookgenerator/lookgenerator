import { NextResponse } from "next/server";

// Asegura ejecución en Lambda Node y evita caché/estático:
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Usa string y arranca vacío para no chocar con los tipos
let cachedOpenAIKey: string = "";

async function getOpenAIKey(): Promise<string> {
  // 1) Primero, intenta por variable de entorno
  if (process.env.OPENAI_API_KEY) {
    cachedOpenAIKey = process.env.OPENAI_API_KEY;
    return cachedOpenAIKey;
  }
  if (cachedOpenAIKey) return cachedOpenAIKey;

  // 2) Fallback a SSM Parameter Store (nombre configurable por env)
  const paramName = process.env.OPENAI_API_KEY_PARAM || "/secrets/OPENAI_API_KEY";

  // Import dinámico solo en server (evita inflar el cliente)
  const { SSMClient, GetParameterCommand } = await import("@aws-sdk/client-ssm");
  const client = new SSMClient({});

  const out = await client.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    })
  );

  const value = out.Parameter?.Value ?? "";
  cachedOpenAIKey = value;
  return cachedOpenAIKey; // <-- siempre string
}

export async function GET() {
  const key = await getOpenAIKey();
  return NextResponse.json({ has_OPENAI: key.length > 0 });
}
