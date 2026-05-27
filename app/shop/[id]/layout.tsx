import type { Metadata } from "next";

import { getProductById } from "@/lib/data/products";

export async function generateMetadata(
  {
    params,
  }: {
    params:
      | Promise<{
          id: string;
        }>
      | {
          id: string;
        };
  }
): Promise<Metadata> {
  const resolvedParams =
    await params;

  const productId =
    resolvedParams.id;

  const product =
    await getProductById(
      productId
    );

  if (!product) {
    return {
      title:
        "Product Not Found - VAM Enterprises",

      description:
        "The requested product could not be found.",
    };
  }

  return {
    title: `${product.name} - VAM Enterprises`,

    description:
      product.description,

    keywords: [
      product.name,

      product.category.name,

      "VAM Enterprises",

      "premium gifts",

      "luxury gifts",
    ],
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}