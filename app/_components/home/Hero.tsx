'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { motion } from 'framer-motion'

// Font stack tries the real Apple Garamond first (if installed on the
// user's machine), then falls back to Cormorant Garamond (loaded via
// next/font/google in layout.tsx) and finally system Garamond/Georgia.
const display = 'font-[family-name:var(--font-display)]'
const body = 'font-[family-name:var(--font-body)]'

function Hero() {
  return (
    <div className="mx-4 md:mx-8 lg:mx-15 my-6 md:my-10">
      <div className="relative overflow-hidden rounded-[6px] border border-[#c9a961]/25 bg-gradient-to-b from-[#141210] via-[#0c0b0a] to-black">
        {/* hairline inset frame — the atelier "card mount" */}
        <div className="pointer-events-none absolute inset-3 rounded-[3px] border border-[#c9a961]/15" />

        {/* ambient glow, kept brand-green but quiet */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#4ca626]/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#c9a961]/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 gap-10 px-6 py-16 md:grid-cols-[1fr_auto_1fr] md:items-center md:px-16 md:py-24 lg:py-32">
          {/* left hairline column — dateline */}
          <div className="hidden md:flex flex-col items-end justify-center gap-3 pr-6 border-r border-[#c9a961]/15">
            <span className={`${body} text-[10px] uppercase tracking-[0.4em] text-[#c9a961]/70`}>
              Est. Gifting
            </span>
            <span className={`${body} text-[10px] uppercase tracking-[0.4em] text-zinc-600`}>
              Kanpur · India
            </span>
          </div>

          <div className="flex flex-col items-center gap-8 text-center">
            {/* Signature: wax-seal monogram */}

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className={`${display} max-w-3xl text-4xl font-medium leading-[1.08] text-[#ece2cd] md:text-6xl lg:text-7xl`}
            >
              The One-Stop <span className="italic text-[#9be274]">Gifting</span> Solution
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className={`${body} max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg`}
            >
              Exclusive, premium gifting from VAM Enterprises — bags and jewellery
              curated by hand, for retail and bulk, in the language of true craft.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            >
              <Button
                className="rounded-none border border-[#c9a961]/50 bg-transparent px-10 py-6 text-sm uppercase tracking-[0.25em] text-[#e9dcb8] transition-colors hover:bg-[#4ca626]/10 hover:text-[#9be274]"
                variant="outline"
                asChild
              >
                <Link href="/shop">Enter the Shop</Link>
              </Button>
            </motion.div>
          </div>

          {/* right hairline column — maker's mark */}
          <div className="hidden md:flex flex-col items-start justify-center gap-3 pl-6 border-l border-[#c9a961]/15">
            <span className={`${body} text-[10px] uppercase tracking-[0.4em] text-[#c9a961]/70`}>
              Bags · Jewellery
            </span>
            <span className={`${body} text-[10px] uppercase tracking-[0.4em] text-zinc-600`}>
              Retail &amp; Bulk
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero