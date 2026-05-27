"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();

  // Mapping of page paths to titles - edit this object to change titles
  const pageTitles: Record<string, string> = {
    "/seller-dashboard": "Seller Dashboard",
    "/seller-dashboard/add-product": "Add Product",
    "/seller-dashboard/products": "Products",
    "/seller-dashboard/categories": "Categories",
    "/seller-dashboard/orders": "Orders",
    "/seller-dashboard/search": "Search",
    "/seller-dashboard/coupons": "Coupons",
    "/seller-dashboard/inventory": "Inventory",
    "/seller-dashboard/notifications": "Notifications",
    "/seller-dashboard/settings": "Settings",
    "/seller-dashboard/edit-product": "Edit Product",
    // Add more paths and titles as needed
  };

  const title = pageTitles[pathname] || "Page Title";
  return (
    <main>
      <div className="w-full h-10 border-b-2 flex justify-between items-center p-10">
        <SidebarTrigger />
        <section className="inline-flex gap-8">
        <Button variant="outline" className="border-2 border-gray-500">
          <Link href="/" className="inline-flex items-center gap-2">
            <ExternalLink />
            Go to Site
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
        </section>
      </div>
    </main>
  );
}
