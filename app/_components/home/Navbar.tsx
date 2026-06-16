"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Show,
  UserButton,
  useUser,
} from "@clerk/nextjs";
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
import {isAdmin} from "@/app/extras/isAdmis";


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
      const response = await fetch('/api/cart');
      if (response.ok) {
        const cart = await response.json();
        const count = cart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        setCartItemCount(count);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };
  /**src="https://i.ibb.co/KzpsqQD9/ve.png" */
  return (
    <main>
        <header className="flex justify-between items-center p-4 px-4 md:px-8 lg:px-15 gap-2 md:gap-4 h-20 md:h-25">
          <Link href="/" className="flex items-center gap-2 md:gap-4">
            <Image
              src="https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png"
              alt="VAM-Enterprises-Logo"
              width={50}
              height={50}
              className="md:w-[70px] md:h-[70px]"
            />
            <h1 className="text-lg md:text-xl font-bold">VAM Enterpises</h1>
          </Link>
          <div className="hidden md:block">
            <ul className="flex gap-6 md:gap-10">
              <li className="hover:underline">
                <Link href="/shop" className="inline-flex items-center gap-2">
                  <ShoppingBag />
                  Shop
                </Link>
              </li>
              <li className="hover:underline">
                <Link href="/about-us" className="inline-flex items-center gap-2">
                  <Building />
                  About Us
                </Link>
              </li>
              {isAdmin(User) && (
              <li className="hover:underline">
                <Link href="/seller-dashboard" className="inline-flex items-center gap-2">
                  <UserCog />
                  Seller Dashboard
                </Link>
              </li>
              )}
            </ul>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Show when="signed-out">
              <Button className="rounded-2xl text-sm md:text-base">
                 <Link href="/auth/sign-in">
                  Sign In
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl text-sm md:text-base"
                asChild
              >
                <Link href="/auth/sign-up">
                  Sign Up
                </Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <h1 className="text-sm md:text-base">Hi, {User?.firstName} !</h1>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label={`Cart${cartItemCount > 0 ? ` (${cartItemCount})` : ''}`}
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
