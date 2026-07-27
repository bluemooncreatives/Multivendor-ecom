import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { checkoutSchema, CheckoutError, placeOrder } from "@/lib/checkout";
import { objectId } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const headerKey = request.headers.get("idempotency-key");
    if (headerKey && headerKey !== input.idempotencyKey) throw new CheckoutError("The checkout request key is inconsistent. Please retry.");
    const session = await getSession();
    const customerId = session ? objectId(session.id) || undefined : undefined;
    const result = await placeOrder(input, customerId);
    return NextResponse.json(result, { status: result.repeated ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: error.issues[0]?.message || "Invalid checkout details." }, { status: 400 });
    if (error instanceof CheckoutError) return NextResponse.json({ message: error.message }, { status: error.status });
    return NextResponse.json({ message: "Checkout is temporarily unavailable. Your cart has not been changed." }, { status: 503 });
  }
}
