"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import React from "react";
import Link from "next/link";

const display = 'font-[family-name:var(--font-display)]'
const body = 'font-[family-name:var(--font-body)]'
const mono = 'font-[family-name:var(--font-mono)]'

function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
    >
      <main className="mx-4 md:mx-8 lg:mx-15 my-6 md:my-10">
        <div className="relative about-bg bg-cover bg-center h-75 md:h-85 lg:h-100 rounded-[28px] border border-white/10 flex flex-col justify-center items-center gap-6 md:gap-10 px-4 md:px-8 lg:px-25 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-black/55" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#4ca626]/15 via-transparent to-[#8b6cff]/10" />

          {/* corner reticle brackets */}
          <div className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-[#4fd1c5]/60 rounded-tl-lg" />
          <div className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-[#4fd1c5]/60 rounded-tr-lg" />
          <div className="pointer-events-none absolute left-4 bottom-4 h-6 w-6 border-l-2 border-b-2 border-[#4fd1c5]/60 rounded-bl-lg" />
          <div className="pointer-events-none absolute right-4 bottom-4 h-6 w-6 border-r-2 border-b-2 border-[#4fd1c5]/60 rounded-br-lg" />

          <div className="relative z-10 flex flex-col items-center gap-6 md:gap-10">
            <span className={`${mono} text-[11px] uppercase tracking-[0.4em] text-[#4fd1c5]`}>
              System // About
            </span>
            <h1 className={`${display} font-semibold text-2xl md:text-3xl lg:text-4xl text-white`}>
              About VAM Enterprises
            </h1>
            <h2 className={`${body} text-lg md:text-xl lg:text-2xl text-zinc-300 max-w-2xl`}>
              A premium brand engineering the one-stop gifting solution — exclusive
              bags and jewellery for retail and bulk.
            </h2>
            <Button
              className="rounded-full border border-[#4ca626]/50 bg-[#4ca626]/10 p-4 md:p-6 lg:px-16 lg:py-7 text-sm md:text-md uppercase tracking-[0.2em] text-[#e8ffe0] backdrop-blur-md hover:bg-[#4ca626]/25 hover:shadow-[0_0_35px_-5px_rgba(76,166,38,0.6)]"
              variant="outline"
              asChild
            >
              <Link href="/about-us">Learn More</Link>
            </Button>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

export default About;
