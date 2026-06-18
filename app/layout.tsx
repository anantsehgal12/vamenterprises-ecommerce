import React from "react";
import { Geist, Geist_Mono, Inter, JetBrains_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import { dark } from "@clerk/themes";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import Lenis from "lenis";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import SmoothScrolling from "./_components/home/SmoothScrolling";
import { useTheme } from "next-themes";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const space = Space_Mono({
  variable: "--font-space",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetMono = JetBrains_Mono({
  variable: "--font-jet-mono",
  subsets: ["latin"],
});

// const dankMono = localFont({
//   src: [
//     {
//       path: './fonts/DankMono-Light.otf',
//       weight: '300',
//       style: 'normal',
//     },
//     {
//       path: './fonts/DankMono-Regular.otf',
//       weight: '400',
//       style: 'normal',
//     },
//     {
//       path: './fonts/DankMono-Bold.otf',
//       weight: '700',
//       style: 'normal',
//     },
//   ],
//   variable: '--font-dank-mono',
//   display: 'swap',
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
            appearance={{
              theme: dark,
            }}
          >
      <html lang="en" className={cn(jetMono.variable, "font-jet-mono")} suppressHydrationWarning>
        <body
          className={`antialiased font-jet-mono`}
        >
          <SmoothScrolling />
          <Toaster position="bottom-right"/>
          {children}
              
        </body>
      </html>
    </ClerkProvider>
  );
}
