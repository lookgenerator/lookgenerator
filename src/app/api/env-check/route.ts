// app/api/env-check/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ErrorLike = { name?: string; message?: string };

function normalizeError(err: unknown): Required<ErrorLike> {
  if (err instanceof Error) return { name: err.name || "Error", message: err.message || "Unknown" };
  if (typeof err === "object" && err !== null) {
    const maybe = err as Record<string, unknown>;
    return {
      name: typeof maybe.name === "string" ? maybe.name : "Error",
      message: typeof maybe.message === "string" ? maybe.message : "Unknown",
    };
  }
  return { name: "Error", message: String(err) };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "plain";

  // ---- Modo 1: solo ENV (sin SSM) ----
  if (mode === "plain") {
    return NextResponse.json({
      ok: true,
      mode,
      has_OPENAI: !!process.env.OPENAI_API_KEY,
      model: process.env.MODEL ?? null,
    });
  }

  // ---- Modo 2: leer desde SSM (con errores tipados) ----
  try {
    // Asegúrate de tener @aws-sdk/client-ssm en dependencies
    const { SSMClient, GetParameterCommand } = await import("@aws-sdk/client-ssm");
    const client = new SSMClient({});
    const name = process.env.OPENAI_API_KEY_PARAM || "/secrets/OPENAI_API_KEY";

    const out = await client.send(
      new GetParameterCommand({ Name: name, WithDecryption: true })
    );

    const value = out.Parameter?.Value ?? "";
    return NextResponse.json({
      ok: true,
      mode,
      param: name,
      has_OPENAI: value.length > 0,
      note: "SSM leído correctamente",
    });
  } catch (err: unknown) {
    const e = normalizeError(err);
    return NextResponse.json(
      {
        ok: false,
        mode,
        error: e.name,
        message: e.message,
        hint:
          "Si el error es 'Cannot find module', añade @aws-sdk/client-ssm a dependencies. " +
          "Si es 'AccessDeniedException', añade permiso ssm:GetParameter a la función SSR.",
      },
      { status: 500 }
    );
  }
}
