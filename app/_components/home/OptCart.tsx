"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  isOptional: "Yes" | "No";
  images: { url: string }[];
}

interface OptionalCartProps {
  onItemAdded?: () => void;
}

export default function OptionalCart({ onItemAdded }: OptionalCartProps) {
  const [optionalProducts, setOptionalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptionalProducts = async () => {
      try {
        const response = await fetch("/api/products");

        if (response.ok) {
          const data = await response.json();

          const optional = data.filter((p: Product) => p.isOptional === "Yes");

          setOptionalProducts(optional);
        }
      } catch (error) {
        console.error("Error fetching optional products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptionalProducts();
  }, []);

  const addToCart = async (productId: string) => {
    setAdding(productId);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        toast.success("Added to cart", {
          style: {
            borderRadius: "12px",
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        });

        onItemAdded?.();
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong", {
        style: {
          borderRadius: "12px",
          background: "#111",
          color: "#fff",
        },
      });
    } finally {
      setAdding(null);
    }
  };

  if (loading || optionalProducts.length === 0) {
    return null;
  }

  const under50 = optionalProducts.filter((p) => parseFloat(p.price) < 50);
  const over50 = optionalProducts.filter((p) => parseFloat(p.price) >= 50);

  const renderProductCarousel = (productsToRender: Product[]) => (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {productsToRender.map((product) => {
          const price = Math.round(Number(product.price));
          const mrp = product.mrp ? Math.round(Number(product.mrp)) : null;

          return (
            <CarouselItem
              key={product.id}
              className="basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[40%] xl:basis-[250px]"
            >
              <Card className="overflow-hidden border border-white/10 bg-gradient-to-r from-zinc-900 to-black p-4 rounded-2xl transition-all duration-300 hover:border-[#4ca626]/30 hover:shadow-[0_0_20px_rgba(76,166,38,0.12)]">
                <div className="flex h-[90px]">
                  <Link href={`/shop/${product.id}`}>
                    <div className="relative h-full rounded-2xl aspect-square shrink-0 overflow-hidden bg-zinc-900">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-3">
                    <Link href={`/shop/${product.id}`}>
                      <div>
                        <h3 className="line-clamp-2 text-xs font-medium text-white">
                          {product.name}
                        </h3>
                      </div>
                    </Link>

                    <div className="flex items-end justify-between">
                      <Link href={`/shop/${product.id}`}>
                        <div>
                          <p className="text-sm font-bold text-[#7ddc56]">
                            ₹{price}
                          </p>
                          {mrp && mrp > price && (
                            <p className="text-[10px] text-zinc-500 line-through">
                              ₹{mrp}
                            </p>
                          )}
                        </div>
                      </Link>
                      <Button
                        size="icon"
                        disabled={adding === product.id}
                        onClick={() => addToCart(product.id)}
                        className="w-8 h-8 bg-[#4ca626] hover:bg-[#5bbd31] rounded-lg"
                      >
                        {adding === product.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex border-white/10 bg-black/90 text-white hover:bg-zinc-900 -left-4" />
      <CarouselNext className="hidden md:flex border-white/10 bg-black/90 text-white hover:bg-zinc-900 -right-4" />
    </Carousel>
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">
            Exclusive Add-Ons
          </h2>
          <p className="text-xs text-zinc-500">
            Get Exclusive Deals on Add-Ons for your cart items.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:gap-8 items-stretch justify-center w-full">
        {under50.length > 0 && (
          <div className="flex-1 min-w-0">
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">
              Value Picks (Under ₹50)
            </h3>
            {renderProductCarousel(under50)}
          </div>
        )}

        {under50.length > 0 && over50.length > 0 && (
          <div className="flex items-center justify-center relative py-4">
            <Separator className="w-full bg-white/10" />
            <span className="absolute bg-black px-3 text-xs font-bold text-zinc-500">
              OR
            </span>
          </div>
        )}

        {over50.length > 0 && (
          <div className="flex-1 min-w-0">
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">
              Premium Add-Ons (₹50 & Above)
            </h3>
            {renderProductCarousel(over50)}
          </div>
        )}
      </div>
    </section>
  );
}
