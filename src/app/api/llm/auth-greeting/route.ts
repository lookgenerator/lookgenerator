import { NextResponse } from "next/server";
import { generateAuthGreeting } from "../handlers/authGreetingHandler";

export async function POST(req: Request) {
  try {
    const { customerName } = await req.json();

    if (!customerName) {
      return NextResponse.json(
        { response: null, error: "customerName required" },
        { status: 400 }
      );
    }

    const greeting = await generateAuthGreeting(customerName);

    return NextResponse.json({ response: greeting });
  } catch (err) {
    console.error("❌ Error en /api/llm/auth-greeting:", err);
    return NextResponse.json({ response: null }, { status: 500 });
  }
}
