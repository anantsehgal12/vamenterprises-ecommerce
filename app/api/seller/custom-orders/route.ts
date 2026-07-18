// app/api/seller/custom-orders/route.ts
//
// ASSUMPTIONS (adjust to match your project):
//   - Drizzle client is exported as `db` from "@/db"
//   - Schema is exported from "@/db/schema"
//   - User.role holds "admin" | "seller" | "customer"
// Adjust the two import paths below if yours differ.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db/index";
import { CustomOrder, User, Product } from "@/src/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import crypto from "crypto";

function generateToken() {
  return crypto.randomBytes(9).toString("base64url"); // short, url-safe
}

async function requireSeller() {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json(
        {
          error: "No Clerk user",
        },
        { status: 401 }
      ),
    } as const;
  }

  const [user] = await db
    .select()
    .from(User)
    .where(eq(User.clerkId, userId))
    .limit(1);

  if (!user) {
    return {
      error: NextResponse.json(
        {
          error: "User not found in database",
          clerkUserId: userId,
        },
        { status: 403 }
      ),
    } as const;
  }
console.log(userId);

  return {
    userId,
    role: user.role,
  } as const;
}

export async function GET() {
  const check = await requireSeller();
  if ("error" in check) return check.error;

console.log(check.role);

  const orders = await db
    .select()
    .from(CustomOrder)
    .orderBy(desc(CustomOrder.createdAt));

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const check = await requireSeller();
  if ("error" in check) return check.error;
  const { userId } = check;

  const body = await req.json();
  const {
    title,
    description,
    items,
    discountAmount = 0,
    customerEmail,
    expiresAt,
    notes,
  } = body ?? {};

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one item" },
      { status: 400 },
    );
  }
  for (const item of items) {
    if (!item.productId || !Number(item.quantity) || item.price == null) {
      return NextResponse.json(
        { error: "Each item needs a product, quantity, and price" },
        { status: 400 },
      );
    }
  }

  // Confirm every referenced product actually exists (and is live) and
  // snapshot its canonical name, rather than trusting the client blindly.
  const productIds: string[] = items.map((i: { productId: string }) => i.productId);
  const foundProducts = await db
    .select()
    .from(Product)
    .where(inArray(Product.id, productIds));

  const productMap = new Map(foundProducts.map((p) => [p.id, p]));
  for (const id of productIds) {
    if (!productMap.has(id)) {
      return NextResponse.json(
        { error: `Product ${id} was not found in the catalog` },
        { status: 400 },
      );
    }
  }

  const itemsWithSnapshot = items.map(
    (item: { productId: string; variant?: string; quantity: number; price: number }) => ({
      productId: item.productId,
      name: productMap.get(item.productId)!.name,
      variant: item.variant || undefined,
      quantity: Number(item.quantity),
      price: Number(item.price),
    }),
  );

  const subtotalAmount = itemsWithSnapshot.reduce(
    (sum: number, i: { price: number; quantity: number }) =>
      sum + i.price * i.quantity,
    0,
  );
  const totalAmount = Math.max(subtotalAmount - Number(discountAmount || 0), 0);
  const token = generateToken();

  const [created] = await db
    .insert(CustomOrder)
    .values({
      token,
      title,
      description: description || null,
      items: itemsWithSnapshot,
      subtotalAmount: subtotalAmount.toFixed(2),
      discountAmount: Number(discountAmount || 0).toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      createdBy: userId,
      customerEmail: customerEmail || null,
      notes: notes || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${token}`;

  return NextResponse.json({ ...created, link }, { status: 201 });
}
