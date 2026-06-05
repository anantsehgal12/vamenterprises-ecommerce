import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/src/db";

import { CartItem, Cart, Product, User } from "@/src/db/schema";

// GET /api/cart - Fetch user's cart with items
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing cart
    let cart = await db.query.Cart.findFirst({
      where: eq(Cart.userId, userId),

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

    // Create cart if not exists
    if (!cart) {
      // Ensure user exists in the DB to prevent foreign key constraints
      const dbUser = await db.query.User.findFirst({
        where: eq(User.clerkId, userId),
      });

      if (!dbUser) {
        const clerkUser = await currentUser();
        if (clerkUser) {
          try {
            await db.insert(User).values({
              id: crypto.randomUUID(),
              clerkId: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
              imageUrl: clerkUser.imageUrl,
            });
          } catch (e: any) {
            // Ignore unique constraint errors if a Clerk webhook inserted the user simultaneously
            if (e.code !== "23505") throw e;
          }
        }
      }

      const createdCart = await db
        .insert(Cart)
        .values({
          id: crypto.randomUUID(),
          userId,
        })
        .returning();

      cart = await db.query.Cart.findFirst({
        where: eq(Cart.id, createdCart[0].id),

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
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);

    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Verify product exists
    const product = await db.query.Product.findFirst({
      where: eq(Product.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get or create cart
    let cart = await db.query.Cart.findFirst({
      where: eq(Cart.userId, userId),
    });

    if (!cart) {
      // Ensure user exists in the DB to prevent foreign key constraints
      const dbUser = await db.query.User.findFirst({
        where: eq(User.clerkId, userId),
      });

      if (!dbUser) {
        const clerkUser = await currentUser();
        if (clerkUser) {
          try {
            await db.insert(User).values({
              id: crypto.randomUUID(),
              clerkId: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
              imageUrl: clerkUser.imageUrl,
            });
          } catch (e: any) {
            // Ignore unique constraint errors if a Clerk webhook inserted the user simultaneously
            if (e.code !== "23505") throw e;
          }
        }
      }

      const createdCart = await db
        .insert(Cart)
        .values({
          id: crypto.randomUUID(),
          userId,
        })
        .returning();

      cart = createdCart[0];
    }

    // Check if item already exists
    const existingItem = await db.query.CartItem.findFirst({
      where: and(
        eq(CartItem.cartId, cart.id),
        eq(CartItem.productId, productId),
        variantId
          ? eq(CartItem.variant, variantId)
          : isNull(CartItem.variant),
      ),
    });

    if (existingItem) {
      // Update quantity
      await db
        .update(CartItem)
        .set({
          quantity: existingItem.quantity + quantity,
        })
        .where(eq(CartItem.id, existingItem.id));

      const updatedItem = await db.query.CartItem.findFirst({
        where: eq(CartItem.id, existingItem.id),

        with: {
          product: {
            with: {
              category: true,
              images: true,
            },
          },
        },
      });

      return NextResponse.json(updatedItem, {
        status: 200,
      });
    }

    // Create new item
    const insertedItem = await db
      .insert(CartItem)
      .values({
        id: crypto.randomUUID(),
        cartId: cart.id,
        productId,
        variant: variantId || null,
        quantity,
      })
      .returning();

    const newItem = await db.query.CartItem.findFirst({
      where: eq(CartItem.id, insertedItem[0].id),

      with: {
        product: {
          with: {
            category: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json(newItem, {
      status: 201,
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);

    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}
