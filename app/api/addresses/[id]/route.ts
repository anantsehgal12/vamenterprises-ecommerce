import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { addresses } from "@/src/db/schema";

// GET /api/addresses/[id] - Get a specific address
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

    const address = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.userId, userId)
      ),
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/addresses/[id] - Update an address
export async function PUT(
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

    // Check if address exists and belongs to user
    const existingAddress = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.userId, userId)
      ),
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
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

    const updatedAddress = await db
      .update(addresses)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, id))
      .returning();

    return NextResponse.json(updatedAddress[0]);
  } catch (error: any) {
    console.error("Error updating address:", error);

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

// DELETE /api/addresses/[id] - Delete an address
export async function DELETE(
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

    // Check if address exists and belongs to user
    const existingAddress = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.userId, userId)
      ),
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    await db
      .delete(addresses)
      .where(eq(addresses.id, id));

    return NextResponse.json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}