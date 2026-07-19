// app/api/custom-orders/[token]/verify/route.ts
//
// Called after the customer completes the Razorpay checkout popup.
// Verifies the signature server-side, then marks the Order paid and
// finalizes the CustomOrder. This is the ONLY place a CustomOrder gets
// marked "completed" — the claim route (POST) never finalizes it.

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

  // Idempotency: Razorpay's handler (or a webhook, or a flaky network retry)
  // can call this more than once for the same payment. If we've already
  // recorded this exact payment as paid, just return success again instead
  // of re-running the writes below.
  if (order.paymentStatus === "paid" && order.razorpayPaymentId === razorpay_payment_id) {
    return NextResponse.json({ success: true, orderNumber: order.orderId });
  }

  const isFullyPaid = order.paymentMethod === "Razorpay";

  await db
    .update(Order)
    .set({
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: isFullyPaid ? "paid" : "partially_paid",
      // Previously this was set to the string "PENDING", which just put the
      // order right back in a pending-looking state immediately after a
      // successful payment. "processing" reflects reality: payment is in,
      // order is now queued for fulfillment.
      status: "processing",
    })
    .where(eq(Order.id, orderId));

  if (order.customOrderId) {
    await db
      .update(CustomOrder)
      .set({ status: "completed", customerId: userId, updatedAt: new Date() })
      .where(eq(CustomOrder.id, order.customOrderId));
  }

  return NextResponse.json({ success: true, orderNumber: order.orderId });
}