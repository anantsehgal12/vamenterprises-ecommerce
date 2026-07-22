import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { Order } from "@/src/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Lookup order by database ID or human-readable orderId
  const order = await db.query.Order.findFirst({
    where: (orders, { or, eq }) => or(eq(orders.id, id), eq(orders.orderId, id)),
  });

  if (!order) {
    return NextResponse.redirect(new URL("/orders", request.url));
  }

  // Redirect cleanly to the canonical page
  return NextResponse.redirect(new URL(`/orders/${order.id}`, request.url));
}