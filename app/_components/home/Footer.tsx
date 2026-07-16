import { Building, ClipboardList, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const display = 'font-[family-name:var(--font-display)]'
const mono = 'font-[family-name:var(--font-mono)]'

const Footer = () => {
  return (
    <div className="mx-4 md:mx-8 lg:mx-15 my-2 relative">
      <div className="pointer-events-none absolute -inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#4ca626]/40 to-transparent" />
      <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-30 gap-4 md:gap-0 pt-8">
        <Link href="/" className="flex items-center gap-2 md:gap-4">
          <Image
            src="https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png"
            alt="Logo"
            width={50}
            height={50}
            className="md:w-[64px] md:h-[64px]"
          />
          <h1 className={`${display} text-lg md:text-xl font-semibold text-white`}>VAM Enterprises</h1>
        </Link>
        <div>
          <ul className={`${mono} flex flex-col md:flex-row gap-4 md:gap-10 text-center md:text-left text-xs uppercase tracking-[0.15em] text-zinc-400`}>
            <li className="transition-colors hover:text-[#9be274]">
              <Link href="/shop" className="inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Shop
              </Link>
            </li>
            <li className="transition-colors hover:text-[#9be274]">
              <Link href="/about-us" className="inline-flex items-center gap-2">
                <Building className="h-4 w-4" />
                About Us
              </Link>
            </li>
            <li className="transition-colors hover:text-[#9be274]">
              <Link href="/my-orders" className="inline-flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                My Orders
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <hr className="w-full my-3 border-white/10" />
      <div className="flex justify-center items-center h-10 pb-6">
        <h1 className={`${mono} text-xs md:text-sm text-zinc-600`}>
          © 2025 VAM Enterprises. All Rights Reserved.
        </h1>
      </div>
    </div>
  );
};

export default Footer;
