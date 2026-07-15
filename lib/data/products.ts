import { eq } from "drizzle-orm";

import { db } from "@/src/db";

import { Product } from "@/src/db/schema";

export async function getProductById(
  productId: string
) {
  try {
    const product =
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

    return product || null;
  } catch (error) {
    console.error(
      "Error fetching product:",
      error
    );

    return null;
  }
}