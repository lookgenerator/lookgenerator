// app/api/llm/ping/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ErrLike = { name?: string; message?: string };
function norm(err: unknown): Required<ErrLike> {
  if (err instanceof Error) return { name: err.name || "Error", message: err.message || "Unknown" };
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "Error",
      message: typeof o.message === "string" ? o.message : "Unknown",
    };
  }
  return { name: "Error", message: String(err) };
}

async function getOpenAIKey(): Promise<string> {
  // 1) Si en el futuro vuelven a funcionar las env de Amplify, úsala primero
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  // 2) Fallback SSM
  const { SSMClient, GetParameterCommand } = await import("@aws-sdk/client-ssm");
  const client = new SSMClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-1",
  });
  const name = process.env.OPENAI_API_KEY_PARAM || "/secrets/OPENAI_API_KEY";
  const out = await client.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return out.Parameter?.Value ?? "";
}

export async function GET() {
  try {
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY not found (env/SSM)" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    const models = await client.models.list();
    return NextResponse.json({ ok: true, modelCount: models.data?.length ?? 0 });
  } catch (err: unknown) {
    const e = norm(err);
    // Útil para CloudWatch:
    console.error("[/api/llm/ping] error:", e.name, e.message);
    return NextResponse.json({ ok: false, error: `${e.name}: ${e.message}` }, { status: 500 });
  }
}
