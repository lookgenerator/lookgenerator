import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const keys = Object.keys(process.env || {});
  const hasOpenAI = keys.includes("OPENAI_API_KEY");
  return NextResponse.json({
    ok: true,
    envKeyCount: keys.length,
    has_OPENAI: hasOpenAI,
  });
}