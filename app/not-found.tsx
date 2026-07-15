import Link from "next/link";
import Navbar from "./_components/home/Navbar";
import Footer from "./_components/home/Footer";
import BottomNav from "./_components/home/BottomNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found - VAM Enterprises",
  description: "The page you're looking for doesn't exist. Explore our collection of premium handbags and jewellery instead.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />
        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <section className="flex min-h-[70vh] sm:min-h-[80vh] flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 pb-28 sm:pb-24 text-center">
          {/* Signature element: a snapped gift tag, dangling by a broken thread */}
          <div className="relative mb-8 sm:mb-10 h-32 w-32 sm:h-48 sm:w-48">
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* dangling thread, frayed at the break */}
              <path
                d="M100 10 C 96 34, 104 46, 100 62"
                stroke="#4ca626"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="1 5"
                opacity="0.7"
              />
              {/* frayed break marks */}
              <path d="M94 60 L100 66 L94 72" stroke="#4ca626" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <path d="M106 60 L100 66 L106 72" stroke="#4ca626" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

              {/* gift tag body, tilted as if it fell */}
              <g transform="rotate(-14 100 130)">
                <rect
                  x="62"
                  y="92"
                  width="76"
                  height="76"
                  rx="10"
                  fill="white"
                  fillOpacity="0.04"
                  stroke="white"
                  strokeOpacity="0.18"
                  strokeWidth="1.5"
                />
                {/* punched hole where the thread used to be */}
                <circle cx="100" cy="108" r="5" fill="black" stroke="#4ca626" strokeOpacity="0.5" strokeWidth="1.5" />
                {/* "404" printed on the tag */}
                <text
                  x="100"
                  y="140"
                  textAnchor="middle"
                  fontSize="26"
                  fontWeight="700"
                  fill="#4ca626"
                  fontFamily="serif"
                >
                  404
                </text>
              </g>
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight px-2">
            This one slipped off the shelf
          </h1>
          <p className="mt-3 sm:mt-4 max-w-xs sm:max-w-md text-sm sm:text-base text-zinc-400 px-2">
            We couldn&apos;t find the page you were looking for. It may have been
            moved, sold out, or never existed.
          </p>

          <div className="mt-8 sm:mt-10 flex justify-center w-full max-w-xs sm:max-w-none flex-col sm:flex-row gap-3 sm:gap-4 px-4 sm:px-0">
            <Link
              href="/"
              className="w-full sm:w-auto rounded-full bg-[#4ca626] px-8 py-3 text-sm font-medium text-black text-center transition hover:bg-[#4ca626]/90"
            >
              Back to Home
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto rounded-full border border-white/15 bg-white/5 backdrop-blur-xl px-8 py-3 text-sm font-medium text-white text-center transition hover:bg-white/10"
            >
              Continue Shopping
            </Link>
          </div>
        </section>

        <Footer />
        <BottomNav />
      </div>
    </main>
  );
}