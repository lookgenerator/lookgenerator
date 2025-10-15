import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ErrorLike = { name?: string; message?: string };
function normalizeError(err: unknown): Required<ErrorLike> {
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

async function readOpenAIKeyFromSSM(): Promise<string> {
  // Import dinámico para empaquetar solo en server
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
    const key = await readOpenAIKeyFromSSM();
    return NextResponse.json({ ok: true, source: "ssm", has_OPENAI: key.length > 0 });
  } catch (err: unknown) {
    const e = normalizeError(err);
    return NextResponse.json(
      {
        ok: false,
        source: "ssm",
        error: e.name,
        message: e.message,
        hint:
          "Si ves Cannot find module → falta @aws-sdk/client-ssm en dependencies. " +
          "Si ves AccessDeniedException → falta permiso ssm:GetParameter/kms:Decrypt en el role SSR.",
      },
      { status: 500 }
    );
  }
}
