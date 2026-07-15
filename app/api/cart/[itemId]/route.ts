import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import {
  CartItem,
} from "@/src/db/schema";

// PUT /api/cart/[itemId] - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    const body = await request.json();

    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Find cart item with ownership verification
    const cartItem = await db.query.CartItem.findFirst({
      where: eq(CartItem.id, itemId),

      with: {
        cart: {
          with: {
            user: true,
          },
        },

        product: {
          with: {
            category: true,
            images: true,
          },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.cart.user?.clerkId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update quantity
    await db
      .update(CartItem)
      .set({
        quantity,
      })
      .where(eq(CartItem.id, itemId));

    // Fetch updated item
    const updatedItem = await db.query.CartItem.findFirst({
      where: eq(CartItem.id, itemId),

      with: {
        product: {
          with: {
            category: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating cart item:", error);

    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    // Find cart item and verify ownership
    const cartItem = await db.query.CartItem.findFirst({
      where: eq(CartItem.id, itemId),

      with: {
        cart: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    if (cartItem.cart.user?.clerkId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete item
    await db
      .delete(CartItem)
      .where(eq(CartItem.id, itemId));

    return NextResponse.json({
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing cart item:", error);

    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}