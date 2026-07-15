import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import {
  Coupon,
  Notification,
} from "@/src/db/schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const {
      code,
      discountType,
      value,
      expiryDate,
      isActive,
      usageLimit,
    } = body;

    if (
      !code ||
      !discountType ||
      value === undefined ||
      value === null ||
      !expiryDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const oldCoupon =
      await db.query.Coupon.findFirst({
        where: eq(Coupon.id, id),
      });

    if (!oldCoupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    const updatedCoupon = await db
      .update(Coupon)
      .set({
        code,
        discountType,
        value: String(value),
        expiryDate: new Date(expiryDate),
        isActive,
        usageLimit: usageLimit
          ? parseInt(usageLimit)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(Coupon.id, id))
      .returning();

    const coupon = updatedCoupon[0];

    // Create notification
    let message = `Coupon ${coupon.code} updated`;

    if (oldCoupon.isActive !== isActive) {
      message += `: ${
        isActive
          ? "Activated"
          : "Deactivated"
      }`;
    }

    await db.insert(Notification).values({
      id: crypto.randomUUID(),
      message,
      type: "COUPON",
    } as typeof Notification.$inferInsert);

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error updating coupon:", error);

    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .delete(Coupon)
      .where(eq(Coupon.id, id));

    return NextResponse.json({
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);

    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}