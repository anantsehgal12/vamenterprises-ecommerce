"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";

interface Variant {
  name?: string | null;
}

interface AddToCartFormProps {
  productId: string;
  variants: Variant[];
  couponCode?: string | null;
  discountedPrice: number; // The exact calculated price to pass to the cart
}

export default function AddToCartForm({
  productId,
  variants,
  couponCode,
  discountedPrice,
}: AddToCartFormProps) {
  // Filter out empty variants
  const validVariants =
    variants?.filter((v) => v.name && v.name.trim() !== "") || [];
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    validVariants.length > 0 ? validVariants[0].name! : null,
  );
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (validVariants.length > 0 && !selectedVariant) {
      toast.error("Please select a variant before adding to cart.", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          variantId: selectedVariant,
          couponCode: couponCode || null,
          price: discountedPrice, // Passes the calculated price to your backend cart
        }),
      });

      if (response.ok) {
        toast.success("Item added to cart!", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`, {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="w-full"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      {validVariants.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Select Variant
          </h3>
          <Select
            value={selectedVariant || ""}
            onValueChange={(value) => setSelectedVariant(value)}
          >
            <SelectTrigger className="h-12 w-full rounded-xl border-white/10 bg-white/[0.03] text-white backdrop-blur-md focus:ring-1 focus:ring-[#4ca626]/50">
              <SelectValue placeholder="Select a variant" />
            </SelectTrigger>
            <SelectContent>
              {validVariants.map((variant, index) => (
                <SelectItem key={index} value={variant.name!}>
                  {variant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className="group relative h-14 w-full overflow-hidden rounded-2xl border border-[#4ca626]/40 bg-gradient-to-r from-[#4ca626] to-[#3d8a1f] text-base font-semibold uppercase tracking-wider text-black shadow-[0_10px_40px_-10px_rgba(76,166,38,0.6)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_15px_55px_-10px_rgba(76,166,38,0.8)] focus:outline-none focus:ring-2 focus:ring-[#8ef065] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:hover:brightness-100"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Adding&hellip;
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </>
          )}
        </span>
      </Button>
    </form>
  );
}