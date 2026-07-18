// app/api/custom-orders/[token]/verify/route.ts
//
// Called after the customer completes the Razorpay checkout popup.
// Verifies the signature server-side, then marks the Order paid.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db/index";
import { Order, CustomOrder } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    orderId, // our internal Order.id
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = await req.json();

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const [order] = await db.select().from(Order).where(eq(Order.id, orderId)).limit(1);
  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isFullyPaid = order.paymentMethod === "Razorpay";

  await db
    .update(Order)
    .set({
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: isFullyPaid ? "paid" : "partially_paid",
      status: "PENDING",
    })
    .where(eq(Order.id, orderId));

  if (order.customOrderId) {
    await db
      .update(CustomOrder)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(CustomOrder.id, order.customOrderId));
  }

  return NextResponse.json({ success: true, orderNumber: order.orderId });
}
