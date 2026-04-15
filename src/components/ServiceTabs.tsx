"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Car,
  FileText,
  Route,
  type LucideIcon,
} from "lucide-react";
import { useAllPackageCategories } from "@/hooks/usePackages";
import PackageCard from "@/components/PackageCard";
import BookingPortal from "@/components/BookingPortal";
import EnrollmentModal from "@/components/EnrollmentModal";
import type { PackageCategory, ServicePackage } from "@/types/packages";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";

const iconMap: Record<string, LucideIcon> = {
  UserCheck,
  Car,
  FileText,
  Route,
};

const categoryImages: Record<string, string> = {
  "Adult-Packages": "/images/adult package img.webp",
  "Teen-Packages": "/images/teen_driver_fixed.webp",
  "Knowledge-Test-Options": "/images/knowledge test img.webp",
  "Driving-Test-Options": "/images/smiling_driving_test.webp",
};

export default function ServiceTabs() {
  const { categories, loading } = useAllPackageCategories();
  const [activeTab, setActiveTab] = useState<PackageCategory>("Adult-Packages");
  const [bookingPkg, setBookingPkg] = useState<ServicePackage | null>(null);
  const [enrollPkg, setEnrollPkg] = useState<ServicePackage | null>(null);
  const [discounts, setDiscounts] = useState<Record<string, any>>({});
  const [cmsContent, setCmsContent] = useState<{ headline?: string; headlineColor?: string; subtext?: string; subtextColor?: string; } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "artifacts/kent/public/data/siteContent/programsHeader"), (snap) => {
      if (snap.exists()) {
        setCmsContent(snap.data() as any);
      }
    }, (error) => {
      console.warn("CMS read denied:", error.message);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "artifacts/kent/public/data/siteContent/homepage/discounts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const discountMap: Record<string, any> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.active !== false) {
          discountMap[data.packageId] = data;
        }
      });
      setDiscounts(discountMap);
    }, (error) => {
      console.warn("Discounts read denied (expected until firestore.rules deployed):", error.message);
    });
    return unsub;
  }, []);

  const activeCategory = categories.find((c) => c.id === activeTab);

  return (
    <>
      <section id="packages" className="py-20 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-extrabold text-forest-700 mb-4"
            >
              Our Driving Programs
            </motion.h2>
            <div
              className={`text-lg md:text-xl font-black uppercase mb-6 tracking-wide ${!cmsContent?.headlineColor ? "bg-gradient-to-r from-red-600 via-rose-500 to-red-600 bg-clip-text text-transparent drop-shadow-sm" : ""}`}
              style={{ color: cmsContent?.headlineColor || undefined }}
            >
              {cmsContent?.headline || "Your License, Your Terms — Open 7 Days a Week"}
            </div>
            <p
              className="text-base max-w-2xl mx-auto leading-relaxed"
              style={{
                color: cmsContent?.subtextColor || undefined,
                fontWeight: cmsContent?.subtextColor ? 'bold' : 600,
              }}
            >
              {cmsContent?.subtext || "Don't wait months for the state. Gain the freedom of the open road on your own schedule. Browse our accelerated programs below and secure your slot in minutes."}
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex justify-center mb-12 mt-10">
            <div className="bg-forest-900 p-1.5 rounded-full flex flex-wrap justify-center gap-1 shadow-xl border border-white/5">
              {categories.map((cat) => {
                const Icon = iconMap[cat.icon] || FileText;
                const isActive = cat.id === activeTab;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-stone-400 hover:text-white"
                    }`}
                    id={`tab-${cat.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Package Cards */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 animate-pulse">
                  <div className="h-5 bg-stone-200 rounded-full w-2/3 mb-4" />
                  <div className="h-8 bg-stone-200 rounded-xl w-1/3 mb-6" />
                  <div className="space-y-2">
                    <div className="h-3 bg-stone-100 rounded-full w-full" />
                    <div className="h-3 bg-stone-100 rounded-full w-5/6" />
                    <div className="h-3 bg-stone-100 rounded-full w-4/6" />
                  </div>
                  <div className="h-12 bg-stone-200 rounded-xl w-full mt-6" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-stone-100">
                  {/* Preload all tab images so switching is instant */}
                  <div aria-hidden className="absolute w-0 h-0 overflow-hidden">
                    {Object.values(categoryImages).map((src) => (
                      <img key={src} src={src} alt="" width={1} height={1} />
                    ))}
                  </div>
                  {categoryImages[activeTab] && (
                    <div className="flex justify-center mb-10">
                      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-md relative aspect-video">
                        <Image
                          src={categoryImages[activeTab]}
                          alt={activeCategory?.label || "Service"}
                          fill
                          className="object-cover object-[center_35%]"
                          sizes="(max-width: 768px) 100vw, 1024px"
                          quality={80}
                          priority
                        />
                      </div>
                    </div>
                  )}

                  <h3 className="text-3xl font-extrabold text-center mb-10 text-forest-800">
                    {activeCategory?.label}
                  </h3>
                  
                  <div
                    className={`grid grid-cols-1 gap-6 ${
                      (activeCategory?.packages.length ?? 0) <= 3
                        ? "md:grid-cols-2 lg:grid-cols-3"
                        : (activeCategory?.packages.length ?? 0) === 4
                        ? "md:grid-cols-2 lg:grid-cols-4"
                        : "md:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {activeCategory?.packages
                      .filter((p) => p.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((pkg, i) => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          index={i}
                          discount={discounts[pkg.id]}
                          onEnroll={(p) => {
                            if (p.category === "Adult-Packages" || p.category === "Teen-Packages") {
                              setEnrollPkg(p);
                            } else {
                              setBookingPkg(p);
                            }
                          }}
                        />
                      ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Booking Portal (Tests) */}
      <BookingPortal
        isOpen={!!bookingPkg}
        onClose={() => setBookingPkg(null)}
        selectedPackage={bookingPkg}
      />
      
      {/* Enrollment Modal (Adults/Teens) */}
      <EnrollmentModal
        isOpen={!!enrollPkg}
        onClose={() => setEnrollPkg(null)}
        selectedPackage={enrollPkg}
      />
    </>
  );
}
