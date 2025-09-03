import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "mxn", metadata = {} } = body;
    if (!amount) {
      return NextResponse.json({ success: false, message: "Falta el monto" }, { status: 400 });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      metadata,
    });
    return NextResponse.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Error Stripe" }, { status: 500 });
  }
}
