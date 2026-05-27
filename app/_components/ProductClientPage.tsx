'use client';

import AddToCartForm from '@/app/_components/AddToCartForm';
import { ProductGallery } from '@/app/_components/ProductGallery';
import Navbar from '@/app/_components/Navbar';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: string;
  mrp: number | null;
  taxRate: number;
  description: string;
  stock: number;
  category: { id: string; name: string };
  variants: {
    id: number;
    name: string | null;
    images: { id: number; src: string; alt: string }[];
  }[];
  images: { id: number; src: string; alt: string }[];
}

export default function ProductClientPage({ product }: { product: Product }) {
  const images = product.images && product.images.length > 0
    ? product.images
    : product.variants && product.variants.length > 0 && product.variants[0].images
    ? product.variants[0].images
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "price": product.price.replace(/[^\\d.]/g, ''),
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    },
    "category": product.category.name,
    "image": images.length > 0 ? images.map(img => img.src) : []
  };

  return (
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <Navbar />
        <div className="pt-6">
          <nav aria-label="Breadcrumb">
            <ol role="list" className="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <li>
                <div className="flex items-center">
                  <a href="/" className="mr-2 text-sm font-medium text-white">
                    Home
                  </a>
                  <svg
                    fill="currentColor"
                    width={16}
                    height={20}
                    viewBox="0 0 16 20"
                    aria-hidden="true"
                    className="h-5 w-4 text-gray-300"
                  >
                    <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                  </svg>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <a href={`/shop?category=${product.category.id}`} className="mr-2 text-sm font-medium text-white">
                    {product.category.name}
                  </a>
                  <svg
                    fill="currentColor"
                    width={16}
                    height={20}
                    viewBox="0 0 16 20"
                    aria-hidden="true"
                    className="h-5 w-4 text-gray-300"
                  >
                    <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                  </svg>
                </div>
              </li>
              <li className="text-sm">
                <span aria-current="page" className="font-medium text-white">
                  {product.name}
                </span>
              </li>
            </ol>
          </nav>

          <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-12 lg:gap-x-20 lg:pr-[30rem]">
            <div className="lg:col-span-7">
              <ProductGallery images={images} productName={product.name} />
            </div>

            <div className="lg:top-24 lg:w-[42rem] lg:right-8 lg:pr-8 lg:overflow-auto">
              <div>
                  <h1 className="lg:text-4xl font-bold tracking-tight text-white md:text-4xl md:pt-4 pt-4 text-4xl lg:p-0">{product.name}</h1>

                  <div className="mt-4">
                    {product.mrp && product.mrp > parseFloat(product.price) && (
                      <p className="text-lg text-gray-400 line-through">
                        MRP: ₹{product.mrp.toFixed(2)}
                      </p>
                    )}
                    <p className="text-2xl md:text-3xl tracking-tight text-gray-200">
                      ₹{Math.round(parseFloat(product.price) + (parseFloat(product.price) * product.taxRate / 100)).toString()}
                    </p>
                    {product.mrp && product.mrp > parseFloat(product.price) && (
                      <p className="text-lg text-green-400 font-semibold">
                        {((product.mrp - parseFloat(product.price)) / product.mrp * 100).toFixed(0)}% off
                      </p>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > 10 ? 'bg-green-100 text-green-800' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock > 10 ? 'In Stock' :
                       product.stock > 0 ? 'Low Stock' :
                       'Out of Stock'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="text-base text-gray-200" style={{ whiteSpace: 'pre-wrap' }}>{product.description}</p>
                  </div>

                  <AddToCartForm productId={product.id} variants={product.variants ?? []} />
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}