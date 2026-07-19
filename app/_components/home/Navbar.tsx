"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
  Building,
  ClipboardList,
  MapPin,
  ShoppingBag,
  ShoppingCartIcon,
  UserCog,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useIsAdmin } from "@/app/extras/useIsAdmin";

const display = "font-[family-name:var(--font-display)]";
const mono = "font-[family-name:var(--font-mono)]";

function Navbar() {
  const user = useUser();
  const User = user.user;
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    if (User) {
      fetchCartItemCount();
    }
  }, [User]);

  const fetchCartItemCount = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const cart = await response.json();
        const count =
          cart.items?.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0,
          ) || 0;
        setCartItemCount(count);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  return (
    <main className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <header className="flex justify-between items-center p-4 px-4 md:px-8 lg:px-15 gap-2 md:gap-4 h-20 md:h-25">
        <Link href="/" className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#4ca626]/30 blur-md" />
            <Image
              src="https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png"
              alt="VAM-Enterprises-Logo"
              width={50}
              height={50}
              className="relative md:w-[64px] md:h-[64px]"
            />
          </div>
          <h1
            className={`${display} text-lg md:text-xl font-semibold text-white tracking-tight`}
          >
            VAM Enterprises
          </h1>
        </Link>

        <div className="hidden md:block">
          <ul
            className={`${mono} flex gap-8 md:gap-10 text-[12px] uppercase tracking-[0.15em] text-zinc-300`}
          >
            <li>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 transition-colors hover:text-[#9be274]"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop
              </Link>
            </li>
            <li>
              <Link
                href="/about-us"
                className="inline-flex items-center gap-2 transition-colors hover:text-[#9be274]"
              >
                <Building className="h-4 w-4" />
                About Us
              </Link>
            </li>
            {useIsAdmin() && (
              <li>
                <Link
                  href="/seller-dashboard"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[#a996ff]"
                >
                  <UserCog className="h-4 w-4" />
                  Seller Dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Show when="signed-out">
            <Button
              className="rounded-full border border-[#4ca626]/50 bg-[#4ca626]/10 text-[#e8ffe0] hover:bg-[#4ca626]/25 text-xs md:text-sm uppercase tracking-[0.15em] px-5 backdrop-blur-md"
              variant="outline"
              asChild
            >
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 text-xs md:text-sm uppercase tracking-[0.15em] px-5 backdrop-blur-md"
              asChild
            >
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <h1 className={`${mono} text-sm md:text-base text-zinc-300`}>
              Hi, {User?.firstName}
            </h1>
            <UserButton userProfileUrl="/account">
              <UserButton.MenuItems>
                <UserButton.Action
                  label={`Cart${cartItemCount > 0 ? ` (${cartItemCount})` : ""}`}
                  labelIcon={<ShoppingCartIcon className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/cart")}
                />
                <UserButton.Action
                  label="My Orders"
                  labelIcon={<ClipboardList className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/my-orders")}
                />
                <UserButton.Action
                  label="My Addresses"
                  labelIcon={<MapPin className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/my-addresses")}
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
        </div>
      </header>
    </main>
  );
}

export default Navbar;
