"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/app/_components/home/Navbar";
import AddToCartForm from "@/app/_components/home/AddToCartForm";
import { ProductGallery } from "@/app/_components/home/ProductGallery";
import YouMayAlsoLike from "@/app/_components/home/YouMayAlsoLike";
import Footer from "@/app/_components/home/Footer";
import BottomNav from "@/app/_components/home/BottomNav";
import { Label } from "@/components/ui/label";
import { Check, Copy, Gem, ShieldCheck, Tag, Truck, X } from "lucide-react";
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
    fetchAvailableCoupons();
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
      <div className="min-h-screen bg-[#050505] text-white">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-[#4ca626]/15" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#4ca626]" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-[#4ca626]/10 blur-md" />
            </div>
            <p className=" text-lg tracking-wide text-zinc-400">
              Preparing your piece&hellip;
            </p>
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
    <div className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#4ca626]/30 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-15%] top-[-10%] h-[550px] w-[550px] rounded-full bg-[#4ca626]/[0.12] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-15%] h-[550px] w-[550px] rounded-full bg-[#4ca626]/[0.08] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 animate-in fade-in duration-700 lg:mb-12"
        >
          <ol className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            <li>
              <Link href="/" className="transition hover:text-[#8ef065]">
                Home
              </Link>
            </li>
            <li className="text-zinc-700">/</li>
            <li>
              <Link
                href={`/shop?category=${product.category.id}`}
                className="transition hover:text-[#8ef065]"
              >
                {product.category.name}
              </Link>
            </li>
            <li className="text-zinc-700">/</li>
            <li className="truncate text-zinc-300">{product.name}</li>
          </ol>
        </nav>

        {/* Main Section */}
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Gallery */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="lg:sticky lg:top-24">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2.5rem] bg-[#4ca626]/10 blur-3xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black p-3 shadow-[0_30px_100px_-20px_rgba(76,166,38,0.35)] backdrop-blur-xl sm:p-5">
                  {/* Gift-ribbon signature badge */}
                  <div className="pointer-events-none absolute -right-12 top-7 z-20 rotate-45">
                    <div className="w-44 bg-gradient-to-r from-[#4ca626] to-[#3d8a1f] py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black shadow-[0_4px_16px_rgba(76,166,38,0.5)]">
                      Gift Ready
                    </div>
                  </div>
                  <ProductGallery
                    images={galleryImages}
                    productName={product.name}
                  />
                </div>
              </div>

              {/* Trust strip */}
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-[#8ef065]" />
                  <span className="text-[10px] font-medium leading-tight text-zinc-400 sm:text-xs">
                    Certified Authentic
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center backdrop-blur-md">
                  <Truck className="h-4 w-4 text-[#8ef065]" />
                  <span className="text-[10px] font-medium leading-tight text-zinc-400 sm:text-xs">
                    Insured Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center backdrop-blur-md">
                  <Gem className="h-4 w-4 text-[#8ef065]" />
                  <span className="text-[10px] font-medium leading-tight text-zinc-400 sm:text-xs">
                    Gift Boxed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black p-6 shadow-[0_30px_100px_-20px_rgba(76,166,38,0.35)] backdrop-blur-xl sm:p-8 lg:p-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#b7f19e] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8ef065]" />
                Premium Product
              </div>

              <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                {product.name}
              </h1>

              {/* Price Section */}
              <div className="mt-6 lg:mt-8">
                <div className="flex flex-wrap items-baseline gap-3">
                  {appliedCoupon ? (
                    <>
                      <h2 className="text-3xl font-extrabold text-[#8ef065] sm:text-4xl">
                        ₹{discountedPriceWithTax}
                      </h2>
                      <p className="text-lg text-zinc-500 line-through sm:text-xl">
                        ₹{standardPriceWithTax}
                      </p>
                      <div className="flex items-center gap-1 rounded-full bg-[#4ca626]/20 px-3 py-1.5 text-xs font-bold text-[#8ef065]">
                        <span>Code: {appliedCoupon.code}</span>
                        <button
                          onClick={removeCoupon}
                          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-white/10"
                          title="Remove Coupon"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        ₹{standardPriceWithTax}
                      </h2>
                      {productMrp && productMrp > standardPriceWithTax && (
                        <p className="text-lg text-zinc-500 line-through sm:text-xl">
                          ₹{productMrp.toFixed(0)}
                        </p>
                      )}
                      {standardDiscountPercent && (
                        <div className="rounded-full bg-[#4ca626]/15 px-3 py-1.5 text-xs font-bold text-[#8ef065] sm:text-sm">
                          {standardDiscountPercent}% OFF
                        </div>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Inclusive of all taxes
                </p>

                <div className="mt-5">
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
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    product.stock > 10
                      ? "bg-[#4ca626]/15 text-[#9ef07a]"
                      : product.stock > 0
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-red-500/15 text-red-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      product.stock > 10
                        ? "bg-[#9ef07a]"
                        : product.stock > 0
                          ? "bg-amber-300"
                          : "bg-red-300"
                    }`}
                  />
                  {product.stock > 10
                    ? "In Stock"
                    : product.stock > 0
                      ? "High Demand — Order Soon"
                      : "Out Of Stock"}
                </span>
              </div>

              {/* Add To Cart */}
              <div className="mt-8 lg:mt-10">
                <AddToCartForm
                  productId={product.id}
                  variants={product.variants ?? []}
                  couponCode={appliedCoupon?.code || null}
                  discountedPrice={discountedPriceWithTax}
                />
              </div>

              <div className="my-8 h-px bg-gradient-to-r from-[#4ca626]/40 via-white/10 to-transparent" />

              {/* Description */}
              <div>
                <h3 className="mb-3 text-lg font-bold text-white">
                  The Details
                </h3>
                <p
                  className="text-[15px] leading-7 text-zinc-400 sm:text-base sm:leading-8"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {product.description}
                </p>
              </div>

              

              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#4ca626] via-[#7ae14d] to-transparent" />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className="mb-8 flex items-center justify-between lg:mb-10">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  You May Also Like
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 sm:text-base">
                  Explore similar premium products
                </p>
              </div>
              <div className="hidden h-px flex-1 bg-gradient-to-r from-[#4ca626]/40 to-transparent lg:ml-8 lg:block" />
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
      <div className="flex gap-3 overflow-x-auto pb-1">
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
    <div className="space-y-2.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-white">
        <Tag className="h-4 w-4 text-[#4ca626]" />
        Available Coupons
      </Label>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {coupons.map((coupon) => {
          const isApplied = appliedCode === coupon.code;
          return (
            <button
              key={coupon.id}
              type="button"
              onClick={() => onSelect(coupon.code)}
              disabled={isApplied}
              className={`w-44 flex-shrink-0 rounded-xl border p-3 text-left transition-colors ${
                isApplied
                  ? "cursor-default border-[#4ca626] bg-[#4ca626]/10"
                  : "border-dashed border-[#4ca626]/40 bg-black/40 hover:border-[#4ca626] hover:bg-[#4ca626]/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-semibold text-[#9be274]">
                  {coupon.code}
                </span>
                {isApplied ? (
                  <Check className="h-4 w-4 flex-shrink-0 text-[#9be274]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                )}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {formatDiscount(coupon)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}