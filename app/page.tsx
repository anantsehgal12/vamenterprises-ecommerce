import Hero from "./_components/Hero";
import Navbar from "./_components/Navbar";
import BestSeller from './_components/BestSeller';
import About from './_components/About';
import Footer from './_components/Footer';
import BottomNav from "./_components/BottomNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - VAM Enterprises",
  description: "VAM Enterprises is your one-stop gifting solution for exclusive and premium luxury gifts. We offer a wide range of unique gifts for both retail and bulk orders. Shop our bestsellers and discover the perfect gift today!",
  keywords: "gifting solution, premium gifts, luxury gifts, unique gifts, corporate gifts, bulk gifts, VAM Enterprises",
};
export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />
        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <div className="relative z-10">
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