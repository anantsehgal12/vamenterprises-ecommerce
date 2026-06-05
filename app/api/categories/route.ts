import { NextRequest, NextResponse } from "next/server";

import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";

import { Category } from "@/src/db/schema";

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(Category)
      .orderBy(asc(Category.name));

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);

    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name } = body;

    if (
      !name ||
      typeof name !== "string" ||
      name.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory =
      await db.query.Category.findFirst({
        where: eq(Category.name, name.trim()),
      });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    const category = await db
      .insert(Category)
      .values({
        id: crypto.randomUUID(),
        name: name.trim(),
      } as typeof Category.$inferInsert)
      .returning();

    return NextResponse.json(category[0], {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating category:", error);

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}