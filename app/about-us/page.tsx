"use client";

import {
  Mail,
  MapPin,
  Phone,
  Clock3,
} from "lucide-react";

import Navbar from "@/app/_components/home/Navbar";
import Footer from "@/app/_components/home/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <Navbar />

      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />

        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-45  px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-2 text-sm font-semibold text-[#b7f19e] backdrop-blur-md">
              About Us
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight md:text-6xl">
              Contact{" "}
              <span className="bg-gradient-to-r from-[#4ca626] to-[#9eff73] bg-clip-text text-transparent">
                VAM Enterprises
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              We’re always available to help you with orders, support,
              partnerships, and product inquiries.
            </p>
          </div>

          {/* Main Card */}
          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_20px_80px_-20px_rgba(76,166,38,0.35)] lg:grid-cols-2">
            {/* LEFT - MAP */}
            <div className="relative min-h-[500px]">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=80.38720445895852,26.411986127726473,80.39720445895853,26.421986127726476&layer=mapnik&marker=26.416986127726474,80.39220445895852"
                className="h-full min-h-[500px] w-full"
                loading="lazy"
                title="Location Map"
                style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg) saturate(0.6)" }}
                referrerPolicy="no-referrer-when-downgrade"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
            </div>

            {/* RIGHT - INFO */}
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <div className="mb-10">
                <h2 className="text-4xl font-black tracking-tight">
                  Get In Touch
                </h2>

                <p className="mt-4 text-lg leading-8 text-zinc-400">
                  Feel free to contact us anytime. Our support team is always
                  ready to assist you.
                </p>
              </div>

              <div className="space-y-6">
                {/* Address */}
                <div className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#4ca626]/40 hover:bg-[#4ca626]/5">
                  <div className="rounded-2xl bg-[#4ca626]/10 p-4 text-[#8ef065]">
                    <MapPin className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Our Address
                    </h3>

                    <p className="mt-2 leading-7 text-zinc-400">
                      VAM Enterprises
                      <br />
                      Kanpur, Uttar Pradesh
                      <br />
                      India
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#4ca626]/40 hover:bg-[#4ca626]/5">
                  <div className="rounded-2xl bg-[#4ca626]/10 p-4 text-[#8ef065]">
                    <Phone className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Phone Number
                    </h3>

                    <p className="mt-2 text-zinc-400">
                      +91 90263 44433
                      <br/>
                      +91 70073 47722
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#4ca626]/40 hover:bg-[#4ca626]/5">
                  <div className="rounded-2xl bg-[#4ca626]/10 p-4 text-[#8ef065]">
                    <Mail className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Email Address
                    </h3>

                    <p className="mt-2 text-zinc-400">
                      support@vamenterprises.in
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#4ca626]/40 hover:bg-[#4ca626]/5">
                  <div className="rounded-2xl bg-[#4ca626]/10 p-4 text-[#8ef065]">
                    <Clock3 className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Working Hours
                    </h3>

                    <p className="mt-2 leading-7 text-zinc-400">
                      Monday - Saturday
                      <br />
                      9:00 AM - 8:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Glow */}
              <div className="mt-10 h-[2px] w-full bg-gradient-to-r from-[#4ca626] via-[#7ae14d] to-transparent" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}