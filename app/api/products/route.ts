import { NextRequest, NextResponse } from "next/server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";

import {
  Category,
  Product,
  ProductImage,
} from "@/src/db/schema";

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const all =
      searchParams.get("all") ===
      "true";

    let allProducts;

    if (all) {
      allProducts =
        await db.query.Product.findMany(
          {
            with: {
              category: true,

              images: true,
            },

            orderBy: desc(
              Product.createdAt
            ),
          }
        );
    } else {
      allProducts =
        await db.query.Product.findMany(
          {
            where: eq(
              Product.isLive,
              true
            ),

            with: {
              category: true,

              images: true,
            },

            orderBy: desc(
              Product.createdAt
            ),
          }
        );
    }

    return NextResponse.json(
      allProducts || []
    );
  } catch (error) {
    console.error(
      "Error fetching products:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
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
      stock,
      isLive,
      isOptional,
      images: productImages,
      variants: productVariants,
    } = body;

    if (
      !name ||
      !price ||
      !description ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate category
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
            "Invalid category",
        },
        { status: 400 }
      );
    }

    // Create product
    const insertedProduct =
      await db
        .insert(Product)
        .values({
          id: crypto.randomUUID(),

          name,

          price: String(price),

          mrp: mrp
            ? String(mrp)
            : null,

          taxRate: taxRate ? String(taxRate) : "0",

          description,

          categoryId,

          stock:
            typeof stock ===
            "number"
              ? stock
              : 0,

          isLive:
            typeof isLive ===
            "boolean"
              ? isLive
              : true,

          isOptional: isOptional === "Yes" ? "Yes" : "No",

          variants: Array.isArray(productVariants)
            ? productVariants
            : [],
        } as typeof Product.$inferInsert)
        .returning();

    const product =
      insertedProduct[0];

    // Product images
    if (
      Array.isArray(
        productImages
      ) &&
      productImages.length > 0
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

    // Fetch final product
    const fullProduct =
      await db.query.Product.findFirst(
        {
          where: eq(
            Product.id,
            product.id
          ),

          with: {
            category: true,

            images: true,
          },
        }
      );

    return NextResponse.json(
      fullProduct,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creating product:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create product",
      },
      { status: 500 }
    );
  }
}