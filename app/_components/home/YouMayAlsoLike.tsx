import React from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowUpRight } from "lucide-react";

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

interface YouMayAlsoLikeProps {
  products: any[];
}

const YouMayAlsoLike: React.FC<YouMayAlsoLikeProps> = ({ products }) => {
  return (
    <div className="w-full py-2">
      <div className="flex flex-col items-center justify-center">
        <div className="mt-2 w-full max-w-6xl">
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent>
              {products.filter((p: Product) => p.isOptional !== "Yes").map((product) => (
                <CarouselItem
                  key={product.id}
                  className="basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/3"
                >
                  <div className="h-full p-2">
                    <Link
                      href={`/shop/${product.id}`}
                      className="group block h-full"
                    >
                      <div className="relative h-full overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black transition-all duration-500 hover:-translate-y-2 hover:border-[#4ca626]/50 hover:shadow-[0_20px_70px_-15px_rgba(76,166,38,0.45)]">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4ca626]/15 via-transparent to-[#78d64f]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                        {/* Image */}
                        <div className="relative overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <div className="relative h-56 w-full overflow-hidden sm:h-60">
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].altText || product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />

                              {/* Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                            </div>
                          ) : (
                            <div className="flex h-56 items-center justify-center bg-zinc-900 text-sm text-zinc-500 sm:h-60">
                              No Image
                            </div>
                          )}

                          {/* Floating Button */}
                          <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <button className="rounded-full bg-[#4ca626] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black shadow-lg transition hover:scale-105 hover:bg-[#5cbf32]">
                              View Product
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex h-[190px] flex-col justify-between p-5 sm:h-[200px]">
                          <div>
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-white">
                                {product.name}
                              </h3>

                              <div className="whitespace-nowrap rounded-full border border-[#4ca626]/20 bg-[#4ca626]/15 px-3 py-1 text-[11px] font-semibold text-[#9be274]">
                                {product.stock && product.stock > 0 ? "In Stock" : "Available"}
                              </div>
                            </div>

                            <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
                              {product.description}
                            </p>
                          </div>

                          {/* Bottom */}
                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              {product.mrp && (
                                <p className="mb-1 text-sm uppercase tracking-wider text-zinc-500 line-through">
                                  ₹{product.mrp}
                                </p>
                              )}

                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white">
                                  ₹{Math.round(parseFloat(product.price) * (1 + parseFloat(product.taxRate) / 100))}
                                </span>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#4ca626]/10 text-[#b8f59b] backdrop-blur-md transition-all duration-300 group-hover:rotate-6 group-hover:bg-[#4ca626] group-hover:text-black">
                              <ArrowUpRight className="h-5 w-5" />
                            </div>
                          </div>
                        </div>

                        {/* Bottom Accent */}
                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#4ca626] transition-all duration-500 group-hover:w-full" />
                      </div>
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden border-white/10 bg-black/50 text-white backdrop-blur-md hover:border-[#4ca626] hover:bg-[#4ca626] hover:text-black md:flex" />
            <CarouselNext className="hidden border-white/10 bg-black/50 text-white backdrop-blur-md hover:border-[#4ca626] hover:bg-[#4ca626] hover:text-black md:flex" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default YouMayAlsoLike;