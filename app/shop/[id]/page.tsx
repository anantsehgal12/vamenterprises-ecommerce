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
import { Label } from "@/components/ui/label";
import { Check, Copy, Tag, X } from "lucide-react"; // Added X icon to remove coupon
import toast from "react-hot-toast";

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

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await fetch("/api/coupons?active=true");
      if (response.ok) {
        const data = await response.json();
        const list: Coupon[] = Array.isArray(data) ? data : data.coupons || [];

        const now = new Date();
        const validCoupons = list.filter((coupon) => {
          if (!coupon.isActive) return false;
          if (coupon.expiryDate && new Date(coupon.expiryDate) < now)
            return false;
          if (
            coupon.usageLimit &&
            coupon.usageLimit > 0 &&
            coupon.usedCount >= coupon.usageLimit
          ) {
            return false;
          }
          return true;
        });

        setAvailableCoupons(validCoupons);
      } else {
        console.error(
          "Failed to fetch available coupons, status:",
          response.status,
        );
        setAvailableCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching available coupons:", error);
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const applyCoupon = async (codeOverride?: string) => {
    const codeToApply = (codeOverride ?? couponCode).trim();

    if (!codeToApply) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply }),
      });

      if (response.ok) {
        const coupon = await response.json();
        setAppliedCoupon(coupon);
        setCouponCode(coupon.code || codeToApply);
        setCouponError("");
        toast.success("Coupon applied successfully!", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Invalid coupon code", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Coupon removed", {
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
    });
  };

  const handleSelectAvailableCoupon = (code: string) => {
    setCouponCode(code);
    applyCoupon(code);
  };

  useEffect(() => {
    if (!productId) return;

    async function getProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`, {
          cache: "no-store",
        });
        if (!res.ok) notFound();
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
    fetchAvailableCoupons(); // Added call to fetch coupons on load
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

  const images =
    product.images && product.images.length > 0 ? product.images : [];
  const galleryImages = images.map((image) => ({
    id: image.id,
    alt: image.altText || product.name,
    src: image.url,
  }));

  // =========================================
  // DYNAMIC PRICE CALCULATIONS
  // =========================================
  const basePrice = parseFloat(product.price);
  const taxRateMultiplier = 1 + parseFloat(product.taxRate) / 100;

  // Standard price calculation (with tax, without coupon)
  const standardPriceWithTax = Math.round(basePrice * taxRateMultiplier);

  // Calculate price with coupon applied
  let discountedPriceWithTax = standardPriceWithTax;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENT") {
      const discountAmount = basePrice * (appliedCoupon.value / 100);
      discountedPriceWithTax = Math.max(
        0,
        Math.round((basePrice - discountAmount) * taxRateMultiplier),
      );
    } else if (appliedCoupon.discountType === "FIXED") {
      // Deducting coupon amount from base price before tax
      discountedPriceWithTax = Math.max(
        0,
        Math.round((basePrice - appliedCoupon.value) * taxRateMultiplier),
      );
    }
  }

  // Determine what discount percentage banner to show
  const productMrp = product.mrp ? parseFloat(product.mrp) : null;
  const standardDiscountPercent =
    productMrp && productMrp > standardPriceWithTax
      ? (((productMrp - standardPriceWithTax) / productMrp) * 100).toFixed(0)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: discountedPriceWithTax.toString(),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

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
                <ProductGallery
                  images={galleryImages}
                  productName={product.name}
                />
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-8 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.35)] backdrop-blur-xl">
              <div className="mb-6 inline-flex items-center rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-2 text-sm font-semibold text-[#b7f19e] backdrop-blur-md">
                Premium Product
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
                {product.name}
              </h1>

              {/* Price Section */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {appliedCoupon ? (
                  <>
                    <h2 className="text-4xl font-extrabold text-[#8ef065]">
                      ₹{discountedPriceWithTax}
                    </h2>
                    <p className="text-xl text-zinc-500 line-through">
                      ₹{standardPriceWithTax}
                    </p>
                    <div className="flex items-center gap-1 rounded-full bg-[#4ca626]/20 px-3 py-1.5 text-xs font-bold text-[#8ef065]">
                      <span>Code: {appliedCoupon.code}</span>
                      <button
                        onClick={removeCoupon}
                        className="ml-1 rounded-full p-0.5 hover:bg-white/10 transition-colors"
                        title="Remove Coupon"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-extrabold text-white">
                      ₹{standardPriceWithTax}
                    </h2>
                    {productMrp && productMrp > standardPriceWithTax && (
                      <p className="text-2xl text-zinc-500 line-through">
                        ₹{productMrp.toFixed(0)}
                      </p>
                    )}
                    {standardDiscountPercent && (
                      <div className="rounded-full bg-[#4ca626]/15 px-4 py-2 text-sm font-bold text-[#8ef065]">
                        {standardDiscountPercent}% OFF
                      </div>
                    )}
                  </>
                )}

                <div className="w-full mt-4">
                  <AvailableCoupons
                    coupons={availableCoupons}
                    loading={loadingCoupons}
                    appliedCode={appliedCoupon?.code}
                    onSelect={handleSelectAvailableCoupon}
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="mt-6">
                <span
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                    product.stock > 10
                      ? "bg-[#4ca626]/15 text-[#9ef07a]"
                      : product.stock > 0
                        ? "bg-yellow-500/15 text-green-400"
                        : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {product.stock > 10
                    ? "● In Stock"
                    : product.stock > 0
                      ? "● High Demand"
                      : "● Out Of Stock"}
                </span>
              </div>

              <div className="my-8 h-px bg-gradient-to-r from-[#4ca626]/40 via-white/10 to-transparent" />

              {/* Description */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-white">
                  Product Description
                </h3>
                <p
                  className="text-base leading-8 text-zinc-400"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {product.description}
                </p>
              </div>

              {/* Add To Cart */}
              <div className="mt-10">
                <AddToCartForm
                  productId={product.id}
                  variants={product.variants ?? []}
                  couponCode={appliedCoupon?.code || null}
                  discountedPrice={discountedPriceWithTax} // Passes calculated price variable
                />
              </div>

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

function AvailableCoupons({
  coupons,
  loading,
  appliedCode,
  onSelect,
}: {
  coupons: Coupon[];
  loading: boolean;
  appliedCode?: string;
  onSelect: (code: string) => void;
}) {
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "FREE_SHIPPING") return "Free Delivery";
    if (coupon.discountType === "PERCENT") return `${coupon.value}% OFF`;
    return `₹${coupon.value} OFF`;
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-40 flex-shrink-0 animate-pulse rounded-xl bg-zinc-800/60"
          />
        ))}
      </div>
    );
  }

  if (coupons.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-white text-sm font-medium flex items-center gap-1.5">
        <Tag className="h-4 w-4 text-[#4ca626]" />
        Available Coupons
      </Label>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {coupons.map((coupon) => {
          const isApplied = appliedCode === coupon.code;
          return (
            <button
              key={coupon.id}
              type="button"
              onClick={() => onSelect(coupon.code)}
              disabled={isApplied}
              className={`flex-shrink-0 w-44 text-left rounded-xl border p-3 transition-colors ${
                isApplied
                  ? "border-[#4ca626] bg-[#4ca626]/10 cursor-default"
                  : "border-dashed border-[#4ca626]/40 bg-black/40 hover:border-[#4ca626] hover:bg-[#4ca626]/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-[#9be274] truncate">
                  {coupon.code}
                </span>
                {isApplied ? (
                  <Check className="h-4 w-4 text-[#9be274] flex-shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {formatDiscount(coupon)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
