import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { addresses } from "@/src/db/schema";

// GET /api/addresses - Get all addresses for the user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(
        desc(addresses.isDefault),
        desc(addresses.createdAt)
      );

    return NextResponse.json(userAddresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      fullName,
      contactNo,
      address,
      city,
      state,
      pincode,
      country,
      email,
      isDefault,
    } = body;

    // Validate required fields
    if (
      !name ||
      !fullName ||
      !contactNo ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !country ||
      !email
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(addresses)
        .set({
          isDefault: false,
        })
        .where(eq(addresses.userId, userId));
    }

    const newAddress = await db
      .insert(addresses)
      .values({
        id: crypto.randomUUID(),
        userId,
        name,
        fullName,
        contactNo,
        address,
        city,
        state,
        pincode,
        country,
        email,
        isDefault: isDefault || false,
      } as typeof addresses.$inferInsert)
      .returning();

    return NextResponse.json(newAddress[0], {
      status: 201,
    });
  } catch (error: any) {
    console.error("Error creating address:", error);

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Address name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}