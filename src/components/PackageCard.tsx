"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { ServicePackage } from "@/types/packages";

interface PackageCardProps {
  pkg: ServicePackage;
  index?: number;
  discount?: { percent: number; label: string };
  onEnroll?: (pkg: ServicePackage) => void;
}

export default function PackageCard({ pkg, index = 0, discount, onEnroll }: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={`relative flex flex-col rounded-2xl p-6 card-lift ${
        pkg.isPopular
          ? "border-2 border-blue-600 bg-blue-50/30 shadow-xl shadow-blue-500/5"
          : "border border-stone-200 bg-white shadow-lg"
      }`}
      id={`package-card-${pkg.id}`}
    >
      {/* Popular / Discount Badge */}
      {discount ? (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-wide shadow-lg shadow-red-600/30 whitespace-nowrap animate-pulse">
          {discount.label || `${discount.percent}% OFF`}
        </span>
      ) : pkg.isPopular ? (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 badge-shimmer text-white px-4 py-1 rounded-full text-xs font-black tracking-wide shadow-lg whitespace-nowrap">
          POPULAR CHOICE
        </span>
      ) : null}

      {/* Header */}
      <h4 className="text-lg font-bold text-navy-700 text-center mt-1">
        {pkg.name}
      </h4>

      {/* Price */}
      <div className="text-center my-4">
        {discount ? (
          <div>
            <span className="text-xl font-bold text-stone-400 line-through mr-2">
              ${pkg.price}
            </span>
            <span className="text-3xl font-extrabold text-red-600">
              ${Math.floor(pkg.price * (1 - discount.percent / 100))}
            </span>
          </div>
        ) : (
          <span className="text-3xl font-extrabold text-navy-600">
            ${pkg.price}
          </span>
        )}
        {pkg.hours > 0 && (
          <span className="text-base font-normal text-stone-400 ml-1">
            / {pkg.hours} {pkg.hours === 1 ? "Hour" : "Hours"}
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-xs text-stone-500 text-center font-medium mb-5">
        {pkg.subtitle}
      </p>

      {/* Features */}
      <ul className="space-y-2.5 text-sm text-stone-700 mb-6 flex-grow">
        {pkg.features.map((feat, i) => (
          <li key={i} className="flex items-start gap-2">
            {feat.included ? (
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-stone-300 mt-0.5 shrink-0" />
            )}
            <span className={feat.included ? "" : "text-stone-400"}>
              {feat.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onEnroll?.(pkg)}
        className="mt-auto w-full bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-full font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-400/30 transition-all"
        id={`enroll-btn-${pkg.id}`}
      >
        Enroll Now
      </motion.button>
    </motion.div>
  );
}

