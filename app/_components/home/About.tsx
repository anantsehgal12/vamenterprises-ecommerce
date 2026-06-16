"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import React from "react";
import Link from "next/link";

function About() {
  return (
    <motion.div
      animate={{ scale: 1 }}
      initial={{ scale: 0.5 }}
      transition={{ duration: 1.25 }}
    >
      <main className="mx-4 md:mx-8 lg:mx-15 my-6 md:my-10">
        <div className="about-bg bg-cover bg-center h-75 md:h-85 lg:h-100 rounded-2xl flex flex-col justify-center items-center gap-6 md:gap-10 px-4 md:px-8 lg:px-25 text-center">
          <h1 className="font-bold text-2xl md:text-3xl lg:text-4xl">About VAM Enterprises</h1>
          <h2 className="text-lg md:text-xl lg:text-2xl ">
            VAM Enterprises is a premium brand that provides you exclusive and
            premium one stop gifting solution in retail and bulk.
          </h2>
          <Button className="rounded-3xl bg-[#4ca626] hover:bg-[#5cbf32] p-4 md:p-6 lg:px-20 lg:py-8 text-sm md:text-md" asChild>
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </main>
    </motion.div>
  );
}

export default About;
