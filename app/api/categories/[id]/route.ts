import { NextRequest, NextResponse } from "next/server";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/src/db";

import {
  Category,
  Product,
} from "@/src/db/schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check if category exists
    const existingCategory =
      await db.query.Category.findFirst({
        where: eq(Category.id, id),
      });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if name already exists
    const nameExists =
      await db.query.Category.findFirst({
        where: and(
          eq(Category.name, name.trim()),
          ne(Category.id, id)
        ),
      });

    if (nameExists) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    const updatedCategory = await db
      .update(Category)
      .set({
        name: name.trim(),
      })
      .where(eq(Category.id, id))
      .returning();

    return NextResponse.json(updatedCategory[0]);
  } catch (error) {
    console.error("Error updating category:", error);

    return NextResponse.json(
      { error: "Failed to update category" },
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

    // Check if category exists
    const category =
      await db.query.Category.findFirst({
        where: eq(Category.id, id),

        with: {
          products: true,
        },
      });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if category has products
    if (category.products.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category with associated products",
        },
        { status: 400 }
      );
    }

    await db
      .delete(Category)
      .where(eq(Category.id, id));

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}