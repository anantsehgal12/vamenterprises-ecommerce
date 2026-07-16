"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";

const display = 'font-[family-name:var(--font-display)]'
const body = 'font-[family-name:var(--font-body)]'
const mono = 'font-[family-name:var(--font-mono)]'

interface Product {
  id: string;
  name: string;
  price: string;
  taxRate: string;
  mrp?: string | null;
  stock?: number;
  description: string;
  isOptional?: "Yes" | "No";
  images: { id: string; url: string; altText: string }[];
  category: { name: string };
  variants?: {
    name?: string;
  }[];
}

function BestSeller() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.filter((p: Product) => p.isOptional !== "Yes"));
        } else {
          console.error("Failed to fetch products:", response.status);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="px-15 py-10 w-full">
        <div className="flex flex-col justify-center items-center">
          <h1 className={`${display} text-3xl font-semibold text-white`}>Our BestSellers</h1>
          <div className={`${mono} mt-8 text-sm text-[#4fd1c5] animate-pulse`}>loading_inventory…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-15 py-6 md:py-10 w-full">
      <div className="flex flex-col justify-center items-center">
        <span className={`${mono} text-[11px] uppercase tracking-[0.4em] text-[#4fd1c5] mb-3`}>
          Curated // Live
        </span>
        <h1 className={`${display} text-2xl md:text-3xl font-semibold text-white`}>
          Our BestSellers
        </h1>
        <div className="w-full max-w-6xl mt-6 md:mt-8">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="p-2 h-full">
                    <Link
                      href={`/shop/${product.id}`}
                      className="group block h-full"
                    >
                      <div className="relative h-full overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-zinc-900/60 via-black to-black transition-all duration-500 hover:-translate-y-2 hover:border-[#4ca626]/50 hover:shadow-[0_20px_70px_-15px_rgba(76,166,38,0.5)]">
                        {/* gradient glow wash */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4ca626]/15 via-transparent to-[#8b6cff]/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                        {/* reticle corner brackets, appear on hover */}
                        <div className="pointer-events-none absolute left-2 top-2 z-20 h-4 w-4 border-l-2 border-t-2 border-[#4fd1c5]/0 transition-colors duration-300 group-hover:border-[#4fd1c5]/70 rounded-tl-md" />
                        <div className="pointer-events-none absolute right-2 top-2 z-20 h-4 w-4 border-r-2 border-t-2 border-[#4fd1c5]/0 transition-colors duration-300 group-hover:border-[#4fd1c5]/70 rounded-tr-md" />

                        <div className="relative overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <div className="relative aspect-square w-full overflow-hidden">
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].altText || product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                            </div>
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-zinc-900 text-zinc-500">
                              No Image
                            </div>
                          )}

                          <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <button className="rounded-full bg-[#4ca626] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-2px_rgba(76,166,38,0.7)] transition hover:scale-105 hover:bg-[#5cbf32]">
                              View Product
                            </button>
                          </div>
                        </div>

                        <div className="relative z-10 flex h-[200px] flex-col justify-between p-5">
                          <div>
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <h3 className={`${display} line-clamp-1 text-lg font-semibold tracking-tight text-white`}>
                                {product.name}
                              </h3>
                              <div className={`${mono} rounded-full border border-[#4ca626]/20 bg-[#4ca626]/15 px-3 py-1 text-[10px] font-semibold text-[#9be274]`}>
                                {product.stock && product.stock > 0 ? "IN STOCK" : "AVAILABLE"}
                              </div>
                            </div>
                            <p className={`${body} line-clamp-2 text-sm leading-relaxed text-zinc-400`}>
                              {product.description}
                            </p>
                          </div>

                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              {product.mrp && (
                                <p className={`${mono} mb-1 text-sm text-zinc-500 line-through`}>
                                  ₹{product.mrp}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={`${mono} text-2xl font-black text-white`}>
                                  ₹{Math.round(parseFloat(product.price) * (1 + parseFloat(product.taxRate) / 100))}
                                </span>
                              </div>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#4ca626]/10 text-[#b8f59b] backdrop-blur-md transition-all duration-300 group-hover:rotate-6 group-hover:bg-[#4ca626] group-hover:text-white">
                              →
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-[#4ca626] to-[#8b6cff] transition-all duration-500 group-hover:w-full" />
                      </div>
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className={`${body} text-center flex items-center justify-center w-full gap-2 mt-6 md:mt-10 text-sm md:text-lg font-bold`}>
          <span>
            and view more{" "}
            <Link href="/shop" className="bg-gradient-to-r from-[#9be274] to-[#a996ff] bg-clip-text text-transparent underline decoration-[#4ca626]/50 underline-offset-4">
              here
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default BestSeller;
