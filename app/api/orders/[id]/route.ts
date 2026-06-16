import { NextRequest, NextResponse } from "next/server";

import {
  auth,
  clerkClient,
} from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import { Order } from "@/src/db/schema";

export async function GET(
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

    const { id } = await params;

    const order =
      await db.query.Order.findFirst({
        where: eq(Order.id, id),

        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true,
                  images: true,
                },
              },
            },
          },
        },
      });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Allow access if owner or admin
    const clerk = await clerkClient();

    const user =
      await clerk.users.getUser(userId);

    const isAdmin =
      user.publicMetadata?.role ===
      "admin";

    if (
      order.userId !== userId &&
      !isAdmin
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(
      "Error fetching order:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;

    const body = await request.json();

    const {
      cancelReason,
      cancelDescription,
      awb,
      status,
      paymentMethod,
    } = body;

    const order =
      await db.query.Order.findFirst({
        where: eq(Order.id, id),
      });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === "admin";

    if (order.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const updateData: any = {};

    // Handle Admin AWB update
    if (awb !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins can update AWB" },
          { status: 403 }
        );
      }
      updateData.awb = awb;
    }

    // Handle Admin Payment Method update
    if (paymentMethod !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Only admins can update Payment Method" }, { status: 403 });
      }
      updateData.paymentMethod = paymentMethod;
    }

    // Handle order cancellation
    if (cancelReason || status === "CANCELLED" || status === "cancelled") {
      // Restrict cancellation
      if (order.status === "SHIPPED" || order.status === "DELIVERED") {
        return NextResponse.json(
          { error: "Cannot cancel shipped or delivered orders" },
          { status: 400 }
        );
      }

      if (order.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Order is already cancelled" },
          { status: 400 }
        );
      }

      updateData.status = "CANCELLED";
      if (cancelReason) updateData.cancelReason = cancelReason;
      if (cancelDescription) updateData.cancelDescription = cancelDescription;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid update data provided" },
        { status: 400 }
      );
    }

    const updatedOrder = await db
      .update(Order)
      .set(updateData)
      .where(eq(Order.id, id))
      .returning();

    return NextResponse.json(
      updatedOrder[0]
    );
  } catch (error) {
    console.error(
      "Error cancelling order:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to cancel order",
      },
      { status: 500 }
    );
  }
}