import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import { CurrencyModel, LanguageModel } from "@/models";

const schema = z.object({ currency: z.string().trim().min(2).max(12).optional(), language: z.string().trim().min(2).max(12).optional() }).refine((value) => value.currency || value.language);

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await connectMongo();
    const jar = await cookies();
    const options = { sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", httpOnly: false, path: "/", maxAge: 365 * 24 * 60 * 60 };
    if (input.currency) {
      const exists = await CurrencyModel.exists({ code: input.currency, active: true });
      if (!exists) return NextResponse.json({ message: "Unsupported currency." }, { status: 400 });
      jar.set("v4_currency", input.currency, options);
    }
    if (input.language) {
      const exists = await LanguageModel.exists({ code: input.language, active: true });
      if (!exists) return NextResponse.json({ message: "Unsupported language." }, { status: 400 });
      jar.set("v4_locale", input.language, options);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof z.ZodError ? "Invalid preference." : "Could not update preference." }, { status: error instanceof z.ZodError ? 400 : 500 });
  }
}
