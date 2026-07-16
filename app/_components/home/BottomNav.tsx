'use client'
import React from 'react'
import Link from "next/link"
import {
  House,
  ClipboardList,
  ShoppingBag,
  ShoppingCartIcon,
  UserCog,
} from "lucide-react"
import { useUser } from "@clerk/nextjs";
import { useIsAdmin } from "@/app/extras/useIsAdmin";

const mono = 'font-[family-name:var(--font-mono)]'

function BottomNav() {
  const { user } = useUser();

  const links = useIsAdmin() ? [
    { name: "Home", url: "/", icon: House },
    { name: "Shop", url: "/shop", icon: ShoppingBag },
    { name: "Cart", url: "/cart", icon: ShoppingCartIcon },
    { name: "Dashboard", url: "/seller-dashboard", icon: UserCog }
  ] : [
    { name: "Home", url: "/", icon: House },
    { name: "Shop", url: "/shop", icon: ShoppingBag },
    { name: "Cart", url: "/cart", icon: ShoppingCartIcon },
    { name: "Orders", url: "/my-orders", icon: ClipboardList }
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t border-white/10 bg-black/70 backdrop-blur-xl md:hidden">
      <div className="pointer-events-none absolute -top-px left-0 h-px w-full bg-gradient-to-r from-transparent via-[#4ca626]/60 to-transparent" />
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.url}
            className="inline-flex flex-col items-center justify-center gap-1 px-5 group"
          >
            <link.icon className="w-5 h-5 text-zinc-400 transition-colors group-hover:text-[#9be274] group-hover:drop-shadow-[0_0_6px_rgba(76,166,38,0.8)]" />
            <span className={`${mono} text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-[#9be274]`}>
              {link.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default BottomNav
