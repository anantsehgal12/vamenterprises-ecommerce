// app/api/custom-orders/[token]/route.ts
//
// GET  -> fetch the custom order for display (auth required)
// POST -> customer submits delivery details + payment method.
//         Creates the real Order + OrderItems, marks the CustomOrder
//         "claimed", and (if a payment is due) creates a Razorpay
//         order for the client to open checkout with.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db/index";
import { CustomOrder, Order, OrderItem } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { razorpay, paiseFromRupees } from "@/lib/razorpay";
import { sendCustomOrderEmail } from "@/lib/email";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [order] = await db
    .select()
    .from(CustomOrder)
    .where(eq(CustomOrder.token, token))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "This order link is invalid" }, { status: 404 });
  }
  if (order.status === "completed" || order.status === "claimed") {
    return NextResponse.json(
      { error: "This order has already been placed", status: order.status },
      { status: 409 },
    );
  }
  if (order.status === "cancelled") {
    return NextResponse.json(
      { error: "This order link has been cancelled", status: order.status },
      { status: 409 },
    );
  }
  if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: "This order link has expired", status: "expired" },
      { status: 409 },
    );
  }

  return NextResponse.json(order);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    fullName,
    phone,
    email,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    paymentMethod,
  } = body ?? {};

  if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    return NextResponse.json(
      { error: "Please fill in all required delivery details" },
      { status: 400 },
    );
  }
  if (!["Razorpay", "COD"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  const [customOrder] = await db
    .select()
    .from(CustomOrder)
    .where(eq(CustomOrder.token, token))
    .limit(1);

  if (!customOrder) {
    return NextResponse.json({ error: "This order link is invalid" }, { status: 404 });
  }
  if (customOrder.status !== "pending") {
    return NextResponse.json(
      { error: "This order can no longer be claimed" },
      { status: 409 },
    );
  }
  if (customOrder.expiresAt && new Date(customOrder.expiresAt) < new Date()) {
    await db
      .update(CustomOrder)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(CustomOrder.id, customOrder.id));
    return NextResponse.json({ error: "This order link has expired" }, { status: 409 });
  }

  const total = Number(customOrder.totalAmount);
  const advanceAmount =
    paymentMethod === "COD" ? Number((total * 0.5).toFixed(2)) : total;
  const balanceAmount = paymentMethod === "COD" ? Number((total - advanceAmount).toFixed(2)) : 0;

  const orderNumber = `VAM-${Date.now().toString(36).toUpperCase()}`;

  const [order] = await db
    .insert(Order)
    .values({
      orderId: orderNumber,
      userId,
      totalAmount: customOrder.totalAmount,
      paymentMethod,
      advanceAmount: advanceAmount.toFixed(2),
      balanceAmount: balanceAmount.toFixed(2),
      customOrderId: customOrder.id,
      address: {
        fullName,
        phone,
        email,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country: country || "India",
      },
    })
    .returning();

  const items = customOrder.items as {
    productId: string;
    name: string;
    variant?: string;
    quantity: number;
    price: number;
  }[];

  await db.insert(OrderItem).values(
    items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: String(item.price),
      variant: item.variant ?? null,
    })),
  );

  await db
    .update(CustomOrder)
    .set({ status: "claimed", customerId: userId, updatedAt: new Date() })
    .where(eq(CustomOrder.id, customOrder.id));

  // Create the Razorpay order for whatever amount is due right now
  // (full amount for Razorpay, 50% advance for COD).
  const razorpayOrder = await razorpay.orders.create({
    amount: paiseFromRupees(advanceAmount),
    currency: "INR",
    receipt: order.orderId,
    notes: { orderId: order.id, customOrderId: customOrder.id },
  });

  await db
  .update(Order)
  .set({ razorpayOrderId: razorpayOrder.id })
  .where(eq(Order.id, order.id));

// Send email (don't fail order creation if email fails)
if (email) {
  try {
    await sendCustomOrderEmail(email, {
      title: customOrder.title,
      description: customOrder.description ?? "",
      expiresAt: customOrder.expiresAt ? customOrder.expiresAt.toISOString() : null,
      totalAmount: total,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/custom-orders/${customOrder.token}`,
      items: items.map((item) => ({
        name: item.name,
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  } catch (error) {
    console.error("Failed to send custom order email:", error);
  }
}

return NextResponse.json({
  orderId: order.id,
  orderNumber: order.orderId,
  amountDue: advanceAmount,
  razorpayOrderId: razorpayOrder.id,
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
});
}
