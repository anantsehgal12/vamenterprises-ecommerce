"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "../_components/home/Navbar";
import SearchBar from "../_components/home/SearchBar";
import Footer from "../_components/home/Footer";
import BottomNav from "../_components/home/BottomNav";

// ── shadcn/ui ──────────────────────────────────────────────────────────────
import { Badge }          from "@/components/ui/badge";
import { Button }         from "@/components/ui/button";
import { Checkbox }       from "@/components/ui/checkbox";
import { Label }          from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea }     from "@/components/ui/scroll-area";
import { Separator }      from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton }       from "@/components/ui/skeleton";
import { Slider }         from "@/components/ui/slider";
import { Switch }         from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
// ──────────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: string;
  taxRate: string;
  description: string;
  mrp: string | null;
  stock: number;
  isOptional?: "Yes" | "No";
  category: { id: string; name: string };
  variants?: { name?: string }[];
  images: { id: string; url: string; altText: string }[];
}

type SortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

const SORT_LABELS: Record<SortOption, string> = {
  default:     "Default",
  "price-asc": "Price: Low to High",
  "price-desc":"Price: High to Low",
  "name-asc":  "Name: A → Z",
  "name-desc": "Name: Z → A",
};

function effectivePrice(p: Product) {
  return Math.round(parseFloat(p.price) * (1 + parseFloat(p.taxRate) / 100));
}

function productCardDescription(description: string, maxLength = 90) {
  const normalizedDescription = description.replace(/\s+/g, " ").trim();

  if (normalizedDescription.length <= maxLength) {
    return normalizedDescription;
  }

  const trimmedDescription = normalizedDescription.slice(0, maxLength);
  const lastSpaceIndex = trimmedDescription.lastIndexOf(" ");

  return `${trimmedDescription.slice(0, lastSpaceIndex > 80 ? lastSpaceIndex : maxLength).trim()}...`;
}

// ── Loading skeleton card ─────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 lg:rounded-[30px]">
      <Skeleton className="aspect-square w-full bg-zinc-800" />
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-zinc-800" />
        <Skeleton className="h-4 w-full  bg-zinc-800" />
        <Skeleton className="h-4 w-2/3  bg-zinc-800" />
        <Skeleton className="h-8 w-1/3  bg-zinc-800 mt-2" />
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ShopPage() {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [searchTerm,setSearchTerm]= useState("");

  // ── Applied filters ──────────────────────────────────────────────────
  const [sortBy,             setSortBy]             = useState<SortOption>("default");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange,         setPriceRange]         = useState<[number, number]>([0, 100000]);
  const [onlyDiscounted,     setOnlyDiscounted]     = useState(false);

  // ── Pending (inside Sheet before Apply) ──────────────────────────────
  const [pendingSort,       setPendingSort]       = useState<SortOption>("default");
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingPrice,      setPendingPrice]      = useState<[number, number]>([0, 100000]);
  const [pendingDiscounted, setPendingDiscounted] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        setProducts(res.ok ? await res.json() : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────
  const allCategories = Array.from(
    new Map(products.map((p) => [p.category.id, p.category.name])).entries()
  );

  const maxPrice = products.length
    ? Math.max(...products.map(effectivePrice))
    : 100000;

  const activeFilterCount =
    (sortBy !== "default" ? 1 : 0) +
    selectedCategories.length +
    (onlyDiscounted ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  // ── Sheet handlers ───────────────────────────────────────────────────
  function openSheet() {
    setPendingSort(sortBy);
    setPendingCategories(selectedCategories);
    setPendingPrice(priceRange);
    setPendingDiscounted(onlyDiscounted);
    setSheetOpen(true);
  }

  function applyFilters() {
    setSortBy(pendingSort);
    setSelectedCategories(pendingCategories);
    setPriceRange(pendingPrice);
    setOnlyDiscounted(pendingDiscounted);
    setSheetOpen(false);
  }

  function resetPending() {
    setPendingSort("default");
    setPendingCategories([]);
    setPendingPrice([0, maxPrice]);
    setPendingDiscounted(false);
  }

  function clearAll() {
    setSortBy("default");
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setOnlyDiscounted(false);
  }

  function togglePendingCat(id: string) {
    setPendingCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // ── Filtered + sorted list ───────────────────────────────────────────
  const visible = products
    .filter((p) => p.stock > 0 && p.isOptional !== "Yes")
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((p) =>
      selectedCategories.length === 0 || selectedCategories.includes(p.category.id)
    )
    .filter((p) => {
      const ep = effectivePrice(p);
      return ep >= priceRange[0] && ep <= priceRange[1];
    })
    .filter((p) => !onlyDiscounted || (p.mrp !== null && p.mrp !== ""))
    .sort((a, b) => {
      if (sortBy === "price-asc")  return effectivePrice(a) - effectivePrice(b);
      if (sortBy === "price-desc") return effectivePrice(b) - effectivePrice(a);
      if (sortBy === "name-asc")   return a.name.localeCompare(b.name);
      if (sortBy === "name-desc")  return b.name.localeCompare(a.name);
      return 0;
    });

  // ─────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-black">
        <Navbar />

        <div className="mx-2 px-4 py-6 sm:px-6 lg:px-8 xl:mx-20">

          {/* ── Hero header ─────────────────────────────────────────── */}
          <div className="mb-10 flex flex-col items-center justify-center text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-1 text-sm font-medium text-[#9be274] backdrop-blur-md"
            >
              Premium Collection
            </Badge>

            <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
              Explore Products
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
              Discover premium products crafted with quality, performance, and modern design.
            </p>
          </div>

          {/* ── Search + controls row ───────────────────────────────── */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 xl:items-baseline lg:items-baseline">

            {/* Search */}
            
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>

            {/* Quick sort Select */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full shrink-0 text-center py-5 rounded-xl border-white/10 bg-zinc-900 text-sm text-white hover:border-white/20 focus:ring-[#4ca626]/40 sm:w-52">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900 text-white">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="focus:bg-[#4ca626]/20 focus:text-[#9be274] text-center"
                  >
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter sheet trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SheetTrigger asChild>
                    <Button
                      onClick={openSheet}
                      variant="outline"
                      className="relative shrink-0 gap-2 py-5 rounded-xl border-white/10 bg-zinc-900 text-white hover:border-[#4ca626]/50 hover:bg-zinc-800 hover:text-white"
                    >
                      {/* funnel icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="text-[#9be274]">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                      </svg>
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full bg-[#4ca626] p-0 text-[10px] font-bold text-white">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="border-white/10 bg-zinc-800 text-white">
                  Open filter options
                </TooltipContent>
              </Tooltip>

              {/* ── Filter Sheet ────────────────────────────────────── */}
              <SheetContent
                side="right"
                className="flex w-full flex-col border-l border-white/10 bg-zinc-950 p-0 text-white sm:max-w-md"
              >
                <SheetHeader className="border-b border-white/10 px-6 py-5">
                  <SheetTitle className="text-base font-bold text-white">
                    Filters & Sort
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-8 py-6">

                    {/* Sort */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Sort By
                      </p>
                      <RadioGroup
                        value={pendingSort}
                        onValueChange={(v) => setPendingSort(v as SortOption)}
                        className="space-y-2"
                      >
                        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                          <Label
                            key={key}
                            htmlFor={`sort-${key}`}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                              pendingSort === key
                                ? "border-[#4ca626]/60 bg-[#4ca626]/15 text-[#9be274]"
                                : "border-white/8 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <RadioGroupItem
                              id={`sort-${key}`}
                              value={key}
                              className="border-zinc-600 text-[#4ca626] data-[state=checked]:border-[#4ca626]"
                            />
                            {SORT_LABELS[key]}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Categories */}
                    {allCategories.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Categories
                        </p>
                        <div className="space-y-2">
                          {allCategories.map(([id, name]) => {
                            const checked = pendingCategories.includes(id);
                            return (
                              <Label
                                key={id}
                                htmlFor={`cat-${id}`}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                                  checked
                                    ? "border-[#4ca626]/60 bg-[#4ca626]/15 text-[#9be274]"
                                    : "border-white/8 bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:text-white"
                                }`}
                              >
                                <Checkbox
                                  id={`cat-${id}`}
                                  checked={checked}
                                  onCheckedChange={() => togglePendingCat(id)}
                                  className="border-zinc-600 data-[state=checked]:border-[#4ca626] data-[state=checked]:bg-[#4ca626]"
                                />
                                {name}
                              </Label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Separator className="bg-white/10" />

                    {/* Price slider */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Max Price
                        </p>
                        <Badge
                          variant="outline"
                          className="rounded-full border-[#4ca626]/40 bg-[#4ca626]/10 text-[#9be274]"
                        >
                          ₹{pendingPrice[1].toLocaleString()}
                        </Badge>
                      </div>
                      <Slider
                        min={0}
                        max={maxPrice}
                        step={100}
                        value={[pendingPrice[1]]}
                        onValueChange={([v]) => setPendingPrice([pendingPrice[0], v])}
                        className="[&_[role=slider]]:border-[#4ca626] [&_[role=slider]]:bg-[#4ca626] [&_.bg-primary]:bg-[#4ca626]"
                      />
                      <div className="mt-2 flex justify-between text-xs text-zinc-500">
                        <span>₹0</span>
                        <span>₹{maxPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Discounted toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-zinc-900/60 px-4 py-4">
                      <div>
                        <Label
                          htmlFor="discounted-switch"
                          className="cursor-pointer text-sm font-medium text-zinc-200"
                        >
                          Discounted items only
                        </Label>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Show products with an MRP discount
                        </p>
                      </div>
                      <Switch
                        id="discounted-switch"
                        checked={pendingDiscounted}
                        onCheckedChange={setPendingDiscounted}
                        className="data-[state=checked]:bg-[#4ca626]"
                      />
                    </div>

                  </div>
                </ScrollArea>

                {/* Footer */}
                <SheetFooter className="border-t border-white/10 px-6 py-4">
                  <div className="flex w-full gap-3">
                    <Button
                      variant="outline"
                      onClick={resetPending}
                      className="flex-1 rounded-xl border-white/10 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={applyFilters}
                      className="flex-1 rounded-xl bg-[#4ca626] font-semibold text-white hover:bg-[#5cbf32]"
                    >
                      Apply
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* ── Active filter chips ─────────────────────────────────── */}
          {activeFilterCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Active:</span>

              {sortBy !== "default" && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-[#4ca626]/40 bg-[#4ca626]/10 px-3 py-1 text-xs text-[#9be274]"
                >
                  {SORT_LABELS[sortBy]}
                  <button onClick={() => setSortBy("default")} className="ml-1 hover:text-white">×</button>
                </Badge>
              )}

              {selectedCategories.map((id) => (
                <Badge
                  key={id}
                  variant="outline"
                  className="gap-1 rounded-full border-[#4ca626]/40 bg-[#4ca626]/10 px-3 py-1 text-xs text-[#9be274]"
                >
                  {allCategories.find(([cid]) => cid === id)?.[1]}
                  <button
                    onClick={() => setSelectedCategories((p) => p.filter((c) => c !== id))}
                    className="ml-1 hover:text-white"
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {onlyDiscounted && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-[#4ca626]/40 bg-[#4ca626]/10 px-3 py-1 text-xs text-[#9be274]"
                >
                  Discounted only
                  <button onClick={() => setOnlyDiscounted(false)} className="ml-1 hover:text-white">×</button>
                </Badge>
              )}

              {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-[#4ca626]/40 bg-[#4ca626]/10 px-3 py-1 text-xs text-[#9be274]"
                >
                  Up to ₹{priceRange[1].toLocaleString()}
                  <button onClick={() => setPriceRange([0, maxPrice])} className="ml-1 hover:text-white">×</button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-auto rounded-full px-2 py-0.5 text-xs text-zinc-500 hover:bg-transparent hover:text-zinc-300 hover:underline"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* ── Results count ───────────────────────────────────────── */}
          <p className="mb-6 text-sm text-zinc-500">
            {loading ? "Loading products…" : `${visible.length} ${visible.length === 1 ? "product" : "products"} found`}
          </p>

          {/* ── Product grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
              : visible.map((product) => {
                  const image    = product.images?.[0];
                  const imageUrl = image?.url ?? null;
                  const ep       = effectivePrice(product);

                  return (
                    <Link
                      key={product.id}
                      href={`/shop/${product.id}`}
                      className="group block h-full"
                    >
                      <Card className="relative h-full overflow-hidden border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black transition-all duration-500 hover:-translate-y-2 hover:border-[#4ca626]/50 hover:shadow-[0_20px_70px_-15px_rgba(76,166,38,0.45)] rounded-2xl lg:rounded-[30px]">

                        {/* Glow overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4ca626]/15 via-transparent to-[#78d64f]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

                        {/* Image */}
                        <div className="relative overflow-hidden">
                          {imageUrl ? (
                            <div className="relative aspect-square w-full overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={image?.altText || product.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                            </div>
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-zinc-900 text-zinc-500">
                              No Image
                            </div>
                          )}

                          {/* Hover CTA */}
                          <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              className="rounded-full bg-[#4ca626] font-semibold text-white shadow-lg hover:bg-[#5cbf32]"
                            >
                              View Product
                            </Button>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="relative z-10 flex h-[200px] flex-col justify-between p-5">
                          <div>
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-white">
                                {product.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className="shrink-0 rounded-full border-[#4ca626]/20 bg-[#4ca626]/15 text-xs font-semibold text-[#9be274]"
                              >
                                In Stock
                              </Badge>
                            </div>
                            <p className="line-clamp-3 break-words text-sm leading-relaxed text-zinc-400">
                              {productCardDescription(product.description)}
                            </p>
                          </div>

                          <div className="mt-2 flex items-end justify-between">
                            <div>
                              {product.mrp && (
                                <p className="mb-1 text-sm uppercase tracking-wider text-zinc-500 line-through">
                                  ₹{product.mrp}
                                </p>
                              )}
                              <span className="text-3xl font-black text-white">
                                ₹{ep}
                              </span>
                            </div>

                            {/* Arrow button */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#4ca626]/10 text-[#b8f59b] backdrop-blur-md transition-all duration-300 group-hover:rotate-6 group-hover:bg-[#4ca626] group-hover:text-white">
                              →
                            </div>
                          </div>
                        </CardContent>

                        {/* Bottom accent bar */}
                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#4ca626] transition-all duration-500 group-hover:w-full" />
                      </Card>
                    </Link>
                  );
                })}
          </div>

          {/* ── Empty state ─────────────────────────────────────────── */}
          {!loading && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-6xl">📦</div>
              <h2 className="mb-2 text-2xl font-bold text-white">No Products Found</h2>
              <p className="max-w-md text-zinc-400">
                {activeFilterCount > 0
                  ? "Try adjusting your filters or clearing them to see more products."
                  : "Try searching with a different keyword."}
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="mt-5 rounded-full border-[#4ca626]/40 bg-[#4ca626]/10 text-[#9be274] hover:bg-[#4ca626]/20 hover:text-white"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          <Separator className="mb-2 mt-14 bg-white/10" />
        </div>

        <Footer />
        <BottomNav />
      </main>
    </TooltipProvider>
  );
}
