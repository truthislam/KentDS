"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ServiceTabs from "@/components/ServiceTabs";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

const DEFAULTS = {
  servicesHeading: "Premium Driving Programs",
  servicesSubtitle: "Expert instructors, flexible schedules, and DOL-approved testing—all in one modern learning experience.",
};

export default function ServicesPage() {
  const [cms, setCms] = useState(DEFAULTS);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const unsubCms = onSnapshot(
      doc(db, "artifacts/kent/public/data/siteContent/servicesPage"),
      (snap) => {
        if (snap.exists()) {
          setCms({ ...DEFAULTS, ...snap.data() as any });
        }
      },
      (err) => console.warn("Services CMS read denied:", err.message)
    );

    const q = query(
      collection(db, "artifacts/kent/public/data/siteContent/homepage/announcements"),
      orderBy("createdAt", "desc")
    );
    const unsubAnn = onSnapshot(q, (snap) => {
      const activeAnns = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter((a: any) => a.active !== false);
      setAnnouncements(activeAnns);
    }, (err) => {
      console.warn("Announcements read denied:", err.message);
    });

    return () => { unsubCms(); unsubAnn(); };
  }, []);

  const typeIcons: Record<string, string> = { info: "ℹ️", warning: "⚠️", promo: "🎉" };
  const typeColors: Record<string, string> = { info: "bg-blue-600", warning: "bg-gold-500", promo: "bg-emerald-600" };

  return (
    <>
      <header className="relative pt-36 pb-20 bg-forest-900 text-white overflow-hidden">
        {/* Ambient blur orbs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-shadow-lg"
            style={{ color: (cms as any).servicesHeadingColor || undefined }}
          >
            {cms.servicesHeading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-xl md:text-2xl max-w-3xl mx-auto font-medium"
            style={{ 
              color: (cms as any).servicesSubtitleColor || "rgb(214 211 209)",
              fontWeight: (cms as any).servicesSubtitleColor ? '600' : undefined 
            }}
          >
            {cms.servicesSubtitle}
          </motion.p>

          {/* Announcements Banner (shared with homepage) */}
          {announcements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 mx-auto max-w-2xl px-4"
            >
              <div className="flex flex-col gap-3 max-h-[120px] overflow-hidden">
                {announcements.map((a) => (
                  <div 
                    key={a.id} 
                    className={`${typeColors[a.type] || typeColors.info}/90 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl text-center shadow-xl flex items-start sm:items-center justify-center gap-3`}
                  >
                    <span className="text-xl shrink-0 mt-0.5 sm:mt-0">{typeIcons[a.type] || typeIcons.info}</span>
                    <span className="text-sm line-clamp-2 md:line-clamp-3 text-ellipsis" style={{ color: a.textColor || undefined, fontWeight: a.isBold ? 700 : 500 }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </header>
      <ServiceTabs />
    </>
  );
}
