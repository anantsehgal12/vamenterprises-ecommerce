// app/api/seller/custom-orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db/index";
import { CustomOrder, User } from "@/src/db/schema";
import { eq } from "drizzle-orm";

async function requireSeller() {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  const [user] = await db
    .select()
    .from(User)
    .where(eq(User.clerkId, userId))
    .limit(1);
  if (!user || !["admin", "seller"].includes(user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { userId } as const;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const check = await requireSeller();
  if ("error" in check) return check.error;

  const [order] = await db
    .select()
    .from(CustomOrder)
    .where(eq(CustomOrder.id, params.id))
    .limit(1);

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...order,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${order.token}`,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const check = await requireSeller();
  if ("error" in check) return check.error;

  const body = await req.json();
  const allowed = ["title", "description", "notes", "expiresAt", "status"] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] =
        key === "expiresAt" && body[key] ? new Date(body[key]) : body[key];
    }
  }
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(CustomOrder)
    .set(updates)
    .where(eq(CustomOrder.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const check = await requireSeller();
  if ("error" in check) return check.error;

  const [existing] = await db
    .select()
    .from(CustomOrder)
    .where(eq(CustomOrder.id, params.id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status === "completed" || existing.status === "claimed") {
    return NextResponse.json(
      { error: "This order is already in progress and can't be deleted — cancel it instead" },
      { status: 400 },
    );
  }

  await db.delete(CustomOrder).where(eq(CustomOrder.id, params.id));
  return NextResponse.json({ success: true });
}
