import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import {
  Notification,
  Order,
} from "@/src/db/schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO:
    // Add admin/seller authorization

    const { id } = await params;

    const { status } =
      await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const oldOrder =
      await db.query.Order.findFirst({
        where: eq(Order.id, id),
      });

    if (!oldOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const updatedOrder = await db
      .update(Order)
      .set({
        status,
      })
      .where(eq(Order.id, id))
      .returning();

    const order = updatedOrder[0];

    // Create notification
    if (
      oldOrder.status !== status
    ) {
      await db
        .insert(Notification)
        .values({
          id: crypto.randomUUID(),

          message: `Order ${order.orderId} status updated: ${oldOrder.status} → ${status}`,

          type: "ORDER",
        } as typeof Notification.$inferInsert);
    }

    return NextResponse.json(
      order
    );
  } catch (error) {
    console.error(
      "Error updating order status:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update order status",
      },
      { status: 500 }
    );
  }
}