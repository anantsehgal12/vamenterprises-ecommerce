"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/app/_components/home/Navbar";
import AddToCartForm from "@/app/_components/home/AddToCartForm";
import { ProductGallery } from "@/app/_components/home/ProductGallery";
import YouMayAlsoLike from "@/app/_components/home/YouMayAlsoLike";
import Footer from "@/app/_components/home/Footer";
import BottomNav from "@/app/_components/home/BottomNav";

interface ProductImage {
  id: string;
  url: string;
  altText: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  mrp: string | null;
  taxRate: string;
  description: string;
  stock: number;

  category: {
    id: string;
    name: string;
  };

  variants: {
    name?: string;
  }[];

  images: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams();

  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    async function getProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          notFound();
        }

        const data = await res.json();

        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);

        notFound();
      } finally {
        setLoading(false);
      }
    }

    getProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;

    async function getRelatedProducts() {
      try {
        const res = await fetch(
          `/api/products?category=${product?.category.id}`,
        );

        const data = await res.json();

        setRelatedProducts(data.filter((p: Product) => p.id !== product?.id));
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    }

    getRelatedProducts();
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />

            <p className="text-lg text-zinc-400">Loading Product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product || product.stock === 0) {
    notFound();
  }

  // =========================================
  // IMAGE PATH LOGIC
  // =========================================

  const images =
    product.images && product.images.length > 0
      ? product.images
        : [];

  const galleryImages = images.map((image) => ({
    id: image.id,

    alt: image.altText || product.name,

    src: image.url,
  }));

  const finalPrice = Math.round(
    parseFloat(product.price) * (1 + parseFloat(product.taxRate) / 100),
  );

  const discount =
    product.mrp && parseFloat(product.mrp) > parseFloat(product.price)
      ? (
          ((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) *
          100
        ).toFixed(0)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",

    "@type": "Product",

    name: product.name,

    description: product.description,

    offers: {
      "@type": "Offer",

      price: product.price.replace(/[^\d.]/g, ""),

      priceCurrency: "INR",

      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },

    category: product.category.name,

    image: galleryImages.length > 0 ? galleryImages.map((img) => img.src) : [],
  };

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <Navbar />

      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />

        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-2 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <li>
              <Link href="/" className="transition hover:text-[#4ca626]">
                Home
              </Link>
            </li>

            <li>/</li>

            <li>
              <Link
                href={`/shop?category=${product.category.id}`}
                className="transition hover:text-[#4ca626]"
              >
                {product.category.name}
              </Link>
            </li>

            <li>/</li>

            <li className="font-medium text-white">{product.name}</li>
          </ol>
        </nav>

        {/* Main Section */}
        <div className="grid gap-10 rounded-3xl bg-gradient-to-b from-zinc-900 to-black p-4 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.35)] lg:grid-cols-2 lg:gap-20">
          {/* Gallery */}
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] blur-2xl " />

            <div className="relative overflow-hidden rounded-[2rem] p-3 backdrop-blur-xl flex items-center justify-center h-full w-full">
              <div className="space-y-4">
                <ProductGallery images={galleryImages} productName={product.name} />
              </div>
            </div>
          </div>
          

          {/* Product Info */}
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-8 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.35)] backdrop-blur-xl">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-2 text-sm font-semibold text-[#b7f19e] backdrop-blur-md">
                Premium Product
              </div>

              {/* Product Name */}
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <h2 className="text-4xl font-extrabold text-white">
                  ₹{finalPrice}
                </h2>

                {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                  <p className="text-2xl text-zinc-500 line-through">
                    ₹{parseFloat(product.mrp).toFixed(0)}
                  </p>
                )}

                {discount && (
                  <div className="rounded-full bg-[#4ca626]/15 px-4 py-2 text-sm font-bold text-[#8ef065]">
                    {discount}% OFF
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="mt-6">
                <span
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                    product.stock > 10
                      ? "bg-[#4ca626]/15 text-[#9ef07a]"
                      : product.stock > 0
                        ? "bg-yellow-500/15 text-yellow-300"
                        : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {product.stock > 10
                    ? "● In Stock"
                    : product.stock > 0
                      ? "● Low Stock"
                      : "● Out Of Stock"}
                </span>
              </div>

              {/* Divider */}
              <div className="my-8 h-px bg-gradient-to-r from-[#4ca626]/40 via-white/10 to-transparent" />

              {/* Description */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-white">
                  Product Description
                </h3>

                <p
                  className="text-base leading-8 text-zinc-400"
                  style={{
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {product.description}
                </p>
              </div>

              {/* Add To Cart */}
              <div className="mt-10">
                <AddToCartForm productId={product.id} variants={product.variants ?? []} />
              </div>

              {/* Bottom Glow */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#4ca626] via-[#7ae14d] to-transparent" />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white">
                  You May Also Like
                </h2>

                <p className="mt-2 text-zinc-400">
                  Explore similar premium products
                </p>
              </div>

              <div className="hidden h-px flex-1 bg-gradient-to-r from-[#4ca626]/40 to-transparent lg:block" />
            </div>

            <YouMayAlsoLike products={relatedProducts} />
          </div>
        )}
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}
