// app/auth/sign-in/page.tsx
"use client";

import { motion } from "motion/react";
import SignIn from "@/app/_components/auth/signIn";

export default function Page() {
  return (
    <main>
      <div className="relative flex min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 " />

        {/* Left Side */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
              Welcome Back
            </span>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Sign In to Your Account
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              Discover premium handcrafted home décor, gifts, and lifestyle
              products designed to elevate every space with timeless
              craftsmanship, elegant designs, and exceptional quality. Find
              unique pieces that bring warmth, style, and character to your
              home.
            </p>
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="relative z-10 flex flex-1 items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SignIn />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
