import Hero from "./_components/home/Hero";
import Navbar from "./_components/home/Navbar";
import BestSeller from './_components/home/BestSeller';
import About from './_components/home/About';
import Footer from './_components/home/Footer';
import BottomNav from "./_components/home/BottomNav";
import type { Metadata } from "next";
import Announcements from "./_components/home/Announcements";

export const metadata: Metadata = {
  title: "Home - VAM Enterprises",
  description: "VAM Enterprises is your one-stop gifting solution for exclusive and premium luxury gifts. We offer a wide range of unique gifts for both retail and bulk orders. Shop our bestsellers and discover the perfect gift today!",
  keywords: "gifting solution, premium gifts, luxury gifts, unique gifts, corporate gifts, bulk gifts, VAM Enterprises",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050506] text-white overflow-x-hidden relative">
      {/* holographic background glow field */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />
        <div className="absolute top-1/3 right-[-5%] h-[400px] w-[400px] rounded-full bg-[#8b6cff]/15 blur-3xl" />
        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4fd1c5]/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] [background:repeating-linear-gradient(0deg,#fff_0px,#fff_1px,transparent_1px,transparent_3px)]" />
      </div>

      <div className="relative z-10 pb-24 md:pb-0">
        <Announcements />
        <Navbar />
        <Hero />
        <BestSeller />
        <About />
        <Footer />
        <BottomNav />
      </div>
    </main>
  );
}
