"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "../_components/Navbar";
import SearchBar from "../_components/SearchBar";
import Footer from "../_components/Footer";

import { Separator } from "@/components/ui/separator";
import BottomNav from "../_components/BottomNav";

interface Product {
  id: string;
  name: string;
  price: string;
  taxRate: string;
  description: string;
  mrp: string | null;
  stock: number;

  category: {
    id: string;
    name: string;
  };

  variants?: {
    name?: string;
  }[];

  images: {
    id: string;
    url: string;
    altText: string;
  }[];
}

export default function ShopPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function getProducts() {
      try {
        const res = await fetch(
          "/api/products",
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          setProducts([]);
        } else {
          const data =
            await res.json();

          setProducts(data);
        }
      } catch (error) {
        console.error(
          "Error fetching products:",
          error
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    getProducts();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />

        {/* Header */}
        <div className="mb-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-1 text-sm font-medium text-[#9be274] backdrop-blur-md">
            Premium Collection
          </div>

          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
            Explore Products
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Discover premium products crafted with quality,
            performance, and modern design.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="mx-2 px-4 py-6 sm:px-6 lg:px-8 xl:mx-20">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-1 text-sm font-medium text-[#9be274] backdrop-blur-md">
            Premium Collection
          </div>

          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
            Explore Products
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Discover premium products crafted with quality,
            performance, and modern design.
          </p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={
              setSearchTerm
            }
          />
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products
            .filter(
              (product) =>
                product.stock > 0
            )
            .filter(
              (product) =>
                product.name
                  .toLowerCase()
                  .includes(
                    searchTerm.toLowerCase()
                  ) ||
                product.description
                  .toLowerCase()
                  .includes(
                    searchTerm.toLowerCase()
                  )
            )
            .map((product) => {
              const image = product.images?.[0];
              const imageUrl = image?.url || null;

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  className="group block h-full"
                >
                  <div className="relative h-full overflow-hidden  border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black transition-all duration-500 hover:-translate-y-2 hover:border-[#4ca626]/50 hover:shadow-[0_20px_70px_-15px_rgba(76,166,38,0.45)] rounded-2xl lg:rounded-[30px] xl:rounded-[30px]">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4ca626]/15 via-transparent to-[#78d64f]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Image */}
                    <div className="relative overflow-hidden">
                      {imageUrl ? (
                        <div className="relative aspect-square w-full overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={
                              image?.altText ||
                              product.name
                            }
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-zinc-900 text-zinc-500">
                          No Image
                        </div>
                      )}

                      {/* Floating Button */}
                      <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <button className="rounded-full bg-[#4ca626] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-[#5cbf32]">
                          View Product
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex h-[200px] flex-col justify-between p-5">
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-white">
                            {product.name}
                          </h3>

                          <div className="rounded-full text-center border border-[#4ca626]/20 bg-[#4ca626]/15 px-3 py-1 text-xs font-semibold text-[#9be274]">
                            In Stock
                          </div>
                        </div>

                        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">
                          {
                            product.description
                          }
                        </p>
                      </div>

                      {/* Bottom */}
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          {product.mrp && (
                            <p className="mb-1 text-sm uppercase tracking-wider text-zinc-500 line-through">
                              ₹
                              {product.mrp}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-white">
                              ₹
                              {Math.round(
                                parseFloat(
                                  product.price
                                ) *
                                  (1 +
                                    parseFloat(product.taxRate) /
                                      100)
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#4ca626]/10 text-[#b8f59b] backdrop-blur-md transition-all duration-300 group-hover:rotate-6 group-hover:bg-[#4ca626] group-hover:text-white">
                          →
                        </div>
                      </div>
                    </div>

                    {/* Bottom Accent */}
                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#4ca626] transition-all duration-500 group-hover:w-full" />
                  </div>
                </Link>
              );
            })}
        </div>

        {/* Empty State */}
        {!loading &&
          products.filter(
            (product) =>
              product.stock > 0 &&
              (product.name
                .toLowerCase()
                .includes(
                  searchTerm.toLowerCase()
                ) ||
                product.description
                  .toLowerCase()
                  .includes(
                    searchTerm.toLowerCase()
                  ))
          ).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-6xl">
                📦
              </div>

              <h2 className="mb-2 text-2xl font-bold text-white">
                No Products Found
              </h2>

              <p className="max-w-md text-zinc-400">
                Try searching with a different keyword.
              </p>
            </div>
          )}

        <Separator className="mb-2 mt-14 w-full bg-white/10" />
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}