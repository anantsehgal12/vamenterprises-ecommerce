import { NextRequest, NextResponse } from "next/server";

import {
  auth,
  clerkClient,
} from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import { Order } from "@/src/db/schema";

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

    // Check admin role
    const clerk = await clerkClient();

    const user =
      await clerk.users.getUser(userId);

    const isAdmin =
      user.publicMetadata?.role ===
      "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { invoiceUrl } = body;

    if (!invoiceUrl) {
      return NextResponse.json(
        {
          error: "No invoice URL provided",
        },
        { status: 400 }
      );
    }

    // Check if order exists
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

    // Update order
    await db
      .update(Order)
      .set({
        invoiceUrl,
      })
      .where(eq(Order.id, id));

    return NextResponse.json({
      invoiceUrl,
    });
  } catch (error) {
    console.error(
      "Error updating invoice URL:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update invoice URL",
      },
      { status: 500 }
    );
  }
}