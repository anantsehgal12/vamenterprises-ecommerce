import { NextRequest, NextResponse } from "next/server";

import {
  eq,
  inArray,
} from "drizzle-orm";

import { getProductById } from "@/lib/data/products";

import { db } from "@/src/db";

import {
  Product,
  ProductImage,
  Notification,
  Category,
} from "@/src/db/schema";

export async function GET(
  request: NextRequest,
  context: {
    params:
      | { id: string }
      | Promise<{ id: string }>;
  }
) {
  try {
    const params =
      await context.params;

    const productId = params.id;

    const product =
      await getProductById(
        productId
      );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      product
    );
  } catch (error) {
    console.error(
      "Error fetching product:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params:
      | { id: string }
      | Promise<{ id: string }>;
  }
) {
  const params =
    await context.params;

  const productId = params.id;

  try {
    const body =
      await request.json();

    const {
      name,
      price,
      mrp,
      taxRate,
      description,
      categoryId,
      images: productImages,
      variants: productVariants,
      isLive,
      isOptional,
    } = body;

    if (!categoryId) {
      return NextResponse.json(
        {
          error:
            "Category ID is required",
        },
        { status: 400 }
      );
    }

    const category =
      await db.query.Category.findFirst(
        {
          where: eq(
            Category.id,
            categoryId
          ),
        }
      );

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Category not found",
        },
        { status: 400 }
      );
    }

    // Delete old product images
    await db
      .delete(ProductImage)
      .where(
        eq(
          ProductImage.productId,
          productId
        )
      );

    // Update product
    const updatedProduct =
      await db
        .update(Product)
        .set({
          name,

          price: String(price),

          mrp: mrp
            ? String(mrp)
            : null,

          taxRate: taxRate ? (String(taxRate) as "0" | "5" | "12" | "18" | "20" | "40") : "0",

          description,

          categoryId,

          isLive:
            isLive !== undefined
              ? isLive
              : undefined,

          isOptional:
            isOptional !== undefined
              ? (isOptional === "Yes" ? "Yes" : "No")
              : undefined,

          variants: Array.isArray(productVariants)
            ? productVariants
            : [],
        })
        .where(
          eq(Product.id, productId)
        )
        .returning();

    const product =
      updatedProduct[0];

    // =========================
    // PRODUCT IMAGES
    // =========================

    if (
      productImages?.length
    ) {
      await db
        .insert(ProductImage)
        .values(
          productImages.map(
            (image: any, index: number) => ({
              url: image?.url || "",
              storagePath: image?.storagePath || "",
              altText: image?.altText || product.name,
              productId:
                product.id,
              displayOrder: index,
            } as typeof ProductImage.$inferInsert)
          )
        );
    }

    // Full updated product
    const fullProduct =
      await db.query.Product.findFirst(
        {
          where: eq(
            Product.id,
            productId
          ),

          with: {
            category: true,

            images: true,
          },
        }
      );

    return NextResponse.json(
      fullProduct
    );
  } catch (error) {
    console.error(
      "Error updating product:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update product",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params:
      | { id: string }
      | Promise<{ id: string }>;
  }
) {
  try {
    const params =
      await context.params;

    const productId = params.id;

    const body =
      await request.json();

    const {
      stock,
      isLive,
      isOptional,
    } = body;

    if (
      stock !== undefined &&
      (typeof stock !==
        "number" ||
        stock < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid stock value",
        },
        { status: 400 }
      );
    }

    if (
      isLive !== undefined &&
      typeof isLive !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid isLive value",
        },
        { status: 400 }
      );
    }

    if (
      isOptional !== undefined &&
      isOptional !== "Yes" &&
      isOptional !== "No"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid isOptional value",
        },
        { status: 400 }
      );
    }

    const oldProduct =
      await db.query.Product.findFirst(
        {
          where: eq(
            Product.id,
            productId
          ),
        }
      );

    if (!oldProduct) {
      return NextResponse.json(
        {
          error:
            "Product not found",
        },
        { status: 404 }
      );
    }

    const updateData: any =
      {};

    if (stock !== undefined)
      updateData.stock =
        stock;

    if (
      isLive !== undefined
    )
      updateData.isLive =
        isLive;

    if (
      isOptional !== undefined
    )
      updateData.isOptional = isOptional;

    if (stock === 0) {
      updateData.isLive =
        false;
    }

    if (isLive === true) {
      if (
        oldProduct.stock === 0
      ) {
        return NextResponse.json(
          {
            error:
              "Cannot set product to live when stock is 0",
          },
          { status: 400 }
        );
      }
    }

    const updatedProduct =
      await db
        .update(Product)
        .set(updateData)
        .where(
          eq(Product.id, productId)
        )
        .returning();

    const product =
      updatedProduct[0];

    // Notifications
    if (
      stock !== undefined &&
      oldProduct.stock !== stock
    ) {
      let message = `Stock updated for ${product.name}: ${oldProduct.stock} → ${stock}`;

      if (stock === 0) {
        message +=
          " (Product automatically set to not live due to zero stock)";
      }

      await db
        .insert(Notification)
        .values({
          id: crypto.randomUUID(),

          message,

          type:
            "STOCK_UPDATE",
        });
    }

    if (
      isLive !== undefined &&
      oldProduct.isLive !==
        isLive
    ) {
      await db
        .insert(Notification)
        .values({
          id: crypto.randomUUID(),

          message: `${product.name} is now ${
            isLive
              ? "live"
              : "not live"
          }`,

          type: "GENERAL",
        });
    }

    const fullProduct =
      await db.query.Product.findFirst(
        {
          where: eq(
            Product.id,
            productId
          ),

          with: {
            category: true,

            images: true,
          },
        }
      );

    return NextResponse.json(
      fullProduct
    );
  } catch (error) {
    console.error(
      "Error updating product:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update product",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params:
      | { id: string }
      | Promise<{ id: string }>;
  }
) {
  try {
    const params =
      await context.params;

    const productId = params.id;

    // Delete product images
    await db
      .delete(ProductImage)
      .where(
        eq(
          ProductImage.productId,
          productId
        )
      );

    // Delete product
    await db
      .delete(Product)
      .where(
        eq(
          Product.id,
          productId
        )
      );

    return NextResponse.json({
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error deleting product:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete product",
      },
      { status: 500 }
    );
  }
}