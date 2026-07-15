import { NextRequest, NextResponse } from "next/server";

import { desc } from "drizzle-orm";

import { db } from "@/src/db";

import {
  Coupon,
  Notification,
} from "@/src/db/schema";

export async function GET() {
  try {
    const allCoupons = await db
      .select()
      .from(Coupon)
      .orderBy(desc(Coupon.createdAt));

    return NextResponse.json(allCoupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);

    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      code,
      discountType,
      value,
      expiryDate,
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

    const insertedCoupon = await db
      .insert(Coupon)
      .values({
        id: crypto.randomUUID(),

        code,

        discountType,

        value: String(value),

        expiryDate: new Date(expiryDate),

        usageLimit: usageLimit
          ? parseInt(usageLimit)
          : null,
      } as typeof Coupon.$inferInsert)
      .returning();

    const coupon = insertedCoupon[0];

    const discountText = coupon.discountType === "FREE_SHIPPING" ? "Free Shipping" : `${coupon.discountType} - ${coupon.value}${coupon.discountType === "PERCENT" ? "%" : "₹"}`;
    // Create notification
    await db.insert(Notification).values({
      id: crypto.randomUUID(),

      message: `New coupon created: ${coupon.code} (${discountText})`,

      type: "COUPON",
    } as typeof Notification.$inferInsert);

    return NextResponse.json(coupon, {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);

    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}