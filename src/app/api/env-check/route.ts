import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    has_OPENAI: !!process.env.OPENAI_API_KEY,
    model: process.env.MODEL || null
  });
}