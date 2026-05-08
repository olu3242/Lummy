"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { FEATURED_CREATOR, FEATURED_PRODUCTS } from "@/lib/data";

/**
 * Animated phone mockup displaying the Lummy creator storefront.
 * Client component — uses framer-motion for entrance animation.
 */
export function PhoneMockup() {
  const creator = FEATURED_CREATOR;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className={[
        "relative mx-auto w-[288px]",
        "rounded-[3rem] border-[8px] border-[#1a1030] bg-[#100827]",
        "shadow-phone animate-phone-float",
        "overflow-hidden",
      ].join(" ")}
      aria-label={`${creator.name}'s Lummy storefront`}
    >
      {/* Status bar */}
      <div className="flex justify-between px-5 pt-3 pb-1 text-[11px] font-bold text-white/50">
        <span>9:41</span>
        <span>◉◉◉</span>
      </div>

      {/* Notch */}
      <div className="mx-auto h-6 w-[90px] rounded-b-2xl bg-[#0a061a]" />

      {/* Banner */}
      <div className="relative h-[88px] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500">
        <Image
          src={creator.avatarUrl}
          alt={creator.name}
          width={58}
          height={58}
          className="absolute -bottom-6 left-4 rounded-full border-[3px] border-[#100827] object-cover shadow-lg"
        />
        <span className="absolute bottom-[-18px] left-[56px] rounded-full bg-brand-violet px-2 py-0.5 text-[9px] font-black text-white">
          {creator.badge}
        </span>
      </div>

      {/* Creator info */}
      <div className="px-4 pt-8 pb-3">
        <p className="font-display text-[15px] font-black text-white">{creator.name}</p>
        <p className="text-[10.5px] text-white/45">{creator.bio}</p>
        <p className="mt-0.5 text-[10px] text-white/30">{creator.location}</p>
        <div className="mt-3 flex gap-5">
          {(
            [
              [creator.followers, "Followers"],
              [creator.customers, "Customers"],
              [creator.totalSales, "Sales"],
            ] as const
          ).map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-[13px] font-black text-white">{value}</p>
              <p className="text-[9px] text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-3 gap-1.5 px-3.5">
        {FEATURED_PRODUCTS.map((product) => (
          <div
            key={product.name}
            className="overflow-hidden rounded-xl border border-white/6 bg-white/5"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={80}
              height={52}
              className="h-[52px] w-full object-cover"
            />
            <div className="p-1.5">
              <p className="truncate text-[8.5px] font-bold text-white">{product.name}</p>
              <p className="text-[8px] font-black text-violet-300">{product.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2 px-3.5 pt-3">
        <button className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#25d366] py-2.5 text-[11px] font-black text-white">
          <MessageCircle size={13} aria-hidden="true" />
          Chat on WhatsApp
        </button>
        <button className="w-full rounded-[10px] bg-grad-brand py-2.5 text-[11px] font-black text-white shadow-violet-sm">
          Shop Now
        </button>
      </div>

      {/* Bottom nav */}
      <div className="mt-3 flex justify-around border-t border-white/6 px-3.5 pb-4 pt-2.5 text-[9.5px] text-white/40">
        {["Home", "Products", "Orders", "Analytics", "More"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </motion.div>
  );
}
