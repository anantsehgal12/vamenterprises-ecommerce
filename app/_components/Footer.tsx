import { Building, ClipboardList, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className="mx-4 md:mx-8 lg:mx-15 my-2">
      <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-30 gap-4 md:gap-0">
        <Link href="/" className="flex items-center gap-2 md:gap-4">
          <Image
            src="https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png"
            alt="Logo"
            width={50}
            height={50}
            className="md:w-[70px] md:h-[70px]"
          />
          <h1 className="text-lg md:text-xl font-bold">VAM Enterpises</h1>
        </Link>
        <div>
          <ul className="flex flex-col md:flex-row gap-4 md:gap-10 text-center md:text-left">
            <li className="hover:underline">
              <Link href="/shop" className="inline-flex items-center gap-2">
                <ShoppingBag />
                Shop
              </Link>
            </li>
            <li className="hover:underline">
              <Link href="" className="inline-flex items-center gap-2">
                <Building />
                About Us
              </Link>
            </li>
            <li className="hover:underline">
              <Link href="/my-orders" className="inline-flex items-center gap-2">
                <ClipboardList />
                My Orders
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <hr className="w-full my-[1.5]"/>
      <div>
        <div className="flex justify-center items-center h-10">
          <h1 className="text-sm md:text-base">© 2025 VAM Enterprises. All Rights Reserved. </h1>
        </div>
      </div>
    </div>
  );
};

export default Footer;
