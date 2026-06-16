'use client'
import React from 'react'
import Link from "next/link"
import {
  House,
  Building,
  ClipboardList,
  ShoppingBag,
  ShoppingCartIcon,
  UserCog,
} from "lucide-react"
import { useUser } from "@clerk/nextjs";
import { isAdmin } from "@/app/extras/isAdmis";

function BottomNav() {
  const { user } = useUser();

  const links = isAdmin(user) ? [
    {
      name: "Home",
      url: "/",
      icon: House
    },
    {
      name: "Shop",
      url: "/shop",
      icon: ShoppingBag
    },
    {
      name: "Cart",
      url: "/cart",
      icon: ShoppingCartIcon
    },
    {
      name: "Dashboard",
      url: "/seller-dashboard",
      icon: UserCog
    }
  ] : [
    {
      name: "Home",
      url: "/",
      icon: House
    },
    {
      name: "Shop",
      url: "/shop",
      icon: ShoppingBag
    },
    {
      name: "Cart",
      url: "/cart",
      icon: ShoppingCartIcon
    },
    {
      name: "Orders",
      url: "/my-orders",
      icon: ClipboardList
    }
  ];

  return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-popover border-gray-600 md:hidden rounded-3xl pl-2 pr-2">
          <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
            {links.map((link) => (
            <button
              key={link.name}
              type="button"
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-800 group"
            >
              <link.icon className="w-5 h-5 mb-2 " />
              <span className="text-sm  dark:text-gray-400">
                <Link href={link.url}>
                  {link.name}
                </Link>
              </span>
            </button>
            ))}
          </div>
        </div>
  )
}

export default BottomNav
