import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

let cachedKey: string | null = null;

async function getOpenAIKey(): Promise<string> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  if (cachedKey) return cachedKey;

  // Lazy-load AWS SDK v3 solo en server
  const { SSMClient, GetParameterCommand } = await import("@aws-sdk/client-ssm");
  const client = new SSMClient({});
  const out = await client.send(
    new GetParameterCommand({
      Name: process.env.OPENAI_API_KEY_PARAM || "/secrets/OPENAI_API_KEY",
      WithDecryption: true,
    })
  );
  cachedKey = out.Parameter?.Value || "";
  return cachedKey;
}

export async function GET() {
  const key = await getOpenAIKey();
  return NextResponse.json({ has_OPENAI: !!key });
}