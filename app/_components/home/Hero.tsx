'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { motion } from 'framer-motion';

function Hero() {
  return (
    <motion.div animate={{ scale: 1 }} initial={{ scale: 0.5 }} transition={{ duration: 1.25 }}>
    <div className='mx-4 md:mx-8 lg:mx-15 my-6 md:my-10'>
      <main className="hero-bg bg-cover bg-center h-90 md:h-100 lg:h-120 rounded-2xl flex flex-col justify-center items-center gap-6 md:gap-10 px-4 md:px-8">
        <h1 className='font-bold text-2xl md:text-3xl lg:text-4xl text-center'>The One-Stop Gifting Solution | VAM Enterprises</h1>
        <h1 className='text-lg md:text-xl px-4 md:px-8 lg:px-25 text-center'>Experience exclusive, premium gifting with VAM Enterprises—your one-stop destination for unique, luxury gifts.</h1>
        <Button className='rounded-3xl bg-[#4ca626] hover:bg-[#5cbf32] p-4 md:p-6 lg:px-20 lg:py-8 text-sm md:text-md' asChild>
          <Link href="/shop">Shop Now</Link>
        </Button>
      </main>
    </div>
    </motion.div>
  )
}

export default Hero
