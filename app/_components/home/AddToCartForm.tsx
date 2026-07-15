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
      className="mt-8"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      {validVariants.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-100">Variants</h3>
          <Select
            value={selectedVariant || ""}
            onValueChange={(value) => setSelectedVariant(value)}
          >
            <SelectTrigger className="w-full mt-4">
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
      <section className="flex justify-center">
        <Button
          onClick={handleAddToCart}
          disabled={loading}
          className="mt-6 w-full rounded-md border border-transparent bg-[#4ca626] px-6 py-5 w-[92%] h-15 text-base font-medium text-white hover:bg-[#4ca626]/80 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add to Cart"}
        </Button>
      </section>
    </form>
  );
}