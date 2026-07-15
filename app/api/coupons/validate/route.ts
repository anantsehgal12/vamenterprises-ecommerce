import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import { Coupon } from "@/src/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const coupon = await db.query.Coupon.findFirst({
      where: eq(
        Coupon.code,
        code.toUpperCase()
      ),
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Coupon is not active" },
        { status: 400 }
      );
    }

    if (
      new Date(coupon.expiryDate) <
      new Date()
    ) {
      return NextResponse.json(
        { error: "Coupon has expired" },
        { status: 400 }
      );
    }

    if (
      coupon.usageLimit &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return NextResponse.json(
        {
          error:
            "Coupon usage limit exceeded",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error(
      "Error validating coupon:",
      error
    );

    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}