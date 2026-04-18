"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Monitor,
  DollarSign,
  Star,
  Clock,
  ChevronDown,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import ServiceTabs from "@/components/ServiceTabs";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import Image from "next/image";

/* â•â•â• CMS Defaults â•â•â• */
const DEFAULTS = {
  heroHeading: "Become a Confident Driver in Kent",
  heroHeadingColor: "",
  heroSubheading:
    "Your journey to safe, skilled driving starts at our Kent branch.",
  heroSubheadingColor: "",
  ctaPrimary: "Enroll Now",
  ctaSecondary: "View Packages",
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WHY US - Features
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const whyUsFeatures = [
  {
    Icon: ShieldCheck,
    title: "State-Approved Testing",
    desc: "Gain peace of mind knowing you're learning at a fully certified testing center for both the official knowledge and driving exams.",
  },
  {
    Icon: Users,
    title: "Expert Instructors",
    desc: "Learn from our team of patient, certified, and supportive instructors who are passionately dedicated to your success on the road.",
  },
  {
    Icon: Monitor,
    title: "Flexible Learning Options",
    desc: "Master driving on your terms. We offer certified online driving courses and engaging in-person lessons to fit your unique schedule.",
  },
  {
    Icon: DollarSign,
    title: "Affordable Pricing",
    desc: "Get the best value on your journey to getting licensed with transparent, competitive pricing and no hidden fees.",
  },
  {
    Icon: Star,
    title: "Highly Rated",
    desc: (
      <>
        Join hundreds of satisfied students who have successfully earned their
        licenses.{" "}
        <a
          href="https://www.google.com/maps/place/Kent+Discount+Driving+School/@47.387869,-122.3323323,3262m/data=!3m1!1e3!4m12!1m2!2m1!1skent+driving+school+kent+washington!3m8!1s0x54905beb9e038b7f:0xed5a861f06500aa!8m2!3d47.393019!4d-122.2968389!9m1!1b1!15sCiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvblooIiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvbpIBDmRyaXZpbmdfc2Nob29s4AEA!16s%2Fg%2F11mcc_vg_w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
        >
          Read our Google Reviews →
        </a>
      </>
    ),
  },
  {
    Icon: Clock,
    title: "Easy Online Scheduling",
    desc: "Take control of your learning with 24/7 access to our online portal to book lessons and tests that fit your life.",
  },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   REVIEWS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const reviews = [
  {
    initials: "MW",
    name: "Marcus Washington",
    text: '"Highly recommend Kent Discount Driving School! The instructors were very patient with me. I passed my road test on the first try with a high score. They made learning how to drive a breeze."',
  },
  {
    initials: "AK",
    name: "Amira Khan",
    text: '"I had a fantastic experience here. As an adult learner, I was really nervous, but they took the time to explain all the rules of the road. Their online scheduling system is super convenient."',
  },
  {
    initials: "JL",
    name: "Jason Lee",
    text: '"The best driving school in the Kent area. They really prepare you for real-world driving, not just how to pass the test. The cars are clean and the staff is extremely professional."',
  },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FAQ
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const faqs = [
  {
    q: "What are the requirements to get a driver's license in Washington?",
    a: "For teens (16-17), you must complete a driver's education course, have 50 hours of supervised driving (including 10 at night), and pass both the DOL knowledge and skills tests. Adults (18+) can waive the education course but must still pass both exams.",
  },
  {
    q: "Are you an official DOL testing center?",
    a: "Yes! We are a fully state-approved and licensed Department of Licensing (DOL) testing center. You can take your official knowledge (permit) test and your final driving (skills) test right here at our Seattle facility.",
  },
  {
    q: "How long are the behind-the-wheel lessons?",
    a: "Our standard behind-the-wheel lessons are one hour long. This provides focused, one-on-one time with our certified instructors to build your skills and confidence on the road.",
  },
  {
    q: "How do I schedule my lessons after I enroll?",
    a: "Once you enroll online, you'll gain access to our secure Student Portal. From there, you can view all available time slots and book them 24/7 at your convenience.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  return (
    <motion.details
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="group border border-stone-200 rounded-xl overflow-hidden hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
      id={`faq-item-${index}`}
    >
      <summary className="w-full flex justify-between items-center text-left p-5 cursor-pointer bg-white group-hover:bg-blue-50/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <span className="font-bold text-base text-forest-900 pr-6">{q}</span>
        <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-open:rotate-180">
          <ChevronDown className="w-5 h-5" />
        </div>
      </summary>
      <div className="border-t border-stone-100 bg-stone-50/50 p-6 text-stone-700 text-sm leading-relaxed">
        {a}
      </div>
    </motion.details>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function HomePage() {
  const [cms, setCms] = useState(DEFAULTS);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const unsubCms = onSnapshot(
      doc(db, "artifacts/kent/public/data/siteContent/homepage"),
      (snap) => {
        if (snap.exists()) {
          setCms({ ...DEFAULTS, ...snap.data() });
        }
      },
      (error) => {
        console.warn(
          "CMS read denied (expected until firestore.rules deployed):",
          error.message
        );
      }
    );

    const q = query(
      collection(
        db,
        "artifacts/kent/public/data/siteContent/homepage/announcements"
      ),
      orderBy("createdAt", "desc")
    );
    const unsubAnn = onSnapshot(
      q,
      (snap) => {
        const activeAnns = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((a: any) => a.active !== false); // hide inactive ones
        setAnnouncements(activeAnns);
      },
      (error) => {
        console.warn(
          "Announcements read denied (expected until firestore.rules deployed):",
          error.message
        );
      }
    );

    return () => {
      unsubCms();
      unsubAnn();
    };
  }, []);

  // Icon mapping for announcements
  const typeIcons: Record<string, string> = {
    info: "â„¹ï¸",
    warning: "âš ï¸",
    promo: "ðŸŽ‰",
  };
  const typeColors: Record<string, string> = {
    info: "bg-blue-600",
    warning: "bg-gold-500",
    promo: "bg-emerald-600",
  };

  return (
    <>
      {/* â”€â”€ HERO â”€â”€ */}
      <header className="relative h-screen flex items-center justify-center text-white text-center overflow-hidden">
        {/* Background Photo */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero_fixed.png"
            alt="Hero background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={100}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#052e16]/80 via-[#14532d]/70 to-[#052e16]/90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-blue-600 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-gold-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-shadow-lg"
            id="hero-heading"
            style={{ color: cms.heroHeadingColor || undefined }}
          >
            {cms.heroHeading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-5 text-lg sm:text-xl md:text-2xl font-light max-w-2xl mx-auto text-shadow"
            style={{
              color: cms.heroSubheadingColor || "rgba(255,255,255,0.8)",
              fontWeight: cms.heroSubheadingColor ? "600" : undefined,
            }}
          >
            {cms.heroSubheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/services"
              className="bg-gold-500 hover:bg-gold-400 text-white font-bold px-8 py-3 rounded-full shadow-lg shadow-gold-500/30 hover:shadow-gold-400/40 transition-all active:scale-95 flex items-center gap-2"
              id="hero-cta-primary"
            >
              {cms.ctaPrimary}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#packages"
              className="text-white border-2 border-white/40 font-bold px-8 py-3 rounded-full hover:bg-white hover:text-forest-800 transition-all"
              id="hero-cta-secondary"
            >
              {cms.ctaSecondary}
            </a>
          </motion.div>

          {/* â”€â”€ ANNOUNCEMENTS â”€â”€ */}
          {announcements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 mx-auto max-w-2xl px-4"
            >
              <div className="flex flex-col gap-3 max-h-[120px] overflow-hidden">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`${typeColors[a.type] || typeColors.info}/90 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-2xl text-center shadow-xl flex items-start sm:items-center justify-center gap-3`}
                  >
                    <span className="text-xl shrink-0 mt-0.5 sm:mt-0">
                      {typeIcons[a.type] || typeIcons.info}
                    </span>
                    <span
                      className="text-sm line-clamp-2 md:line-clamp-3 text-ellipsis"
                      style={{
                        color: a.textColor || undefined,
                        fontWeight: a.isBold ? 700 : 500,
                      }}
                    >
                      {a.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-white/40" />
        </motion.div>
      </header>

      {/* â”€â”€ WHY US â”€â”€ */}
      <section id="why-us" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-forest-700 mb-4"
          >
            Why Drive With Us?
          </motion.h2>
          <p className="text-base text-stone-600 max-w-3xl mx-auto mb-12">
            Experience the difference with a driving school that puts you first,
            offering unparalleled flexibility and support on your journey to
            getting licensed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyUsFeatures.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center p-6 rounded-2xl hover:bg-stone-50 transition-colors"
              >
                <div className="bg-blue-100 text-forest-700 rounded-full p-4 mb-4">
                  <feat.Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-forest-700">
                  {feat.title}
                </h3>
                <p className="text-stone-600 mt-2 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ ABOUT SNIPPET â”€â”€ */}
      <section id="about" className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-1/2"
          >
            <h2 className="text-3xl font-extrabold mb-4 text-forest-700">
              Your Kent Partners on the Road to Confidence
            </h2>
            <div className="space-y-4 text-base text-stone-600 leading-relaxed">
              <p>
                Welcome to Discount Driving School, your dedicated partner on
                the road to becoming a safe and confident driver for life.
                Serving the Kent community, our mission is to provide a
                supportive, patient, and professional learning environment where
                every student can thrive.
              </p>
              <p>
                Our success is built on a foundation of expert instruction and a
                state-approved curriculum. Every one of our certified
                instructors is passionate about teaching and dedicated to your
                personal progress.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-1/2 group"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video md:aspect-[4/3]">
              <Image
                src="/images/about_fixed.png"
                alt="Discount Driving School professional instructor"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={100}
                loading="lazy"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* â”€â”€ PACKAGES (Dynamic from Firestore) â”€â”€ */}
      <ServiceTabs />

      {/* â”€â”€ FAQ â”€â”€ */}
      <section id="faq" className="py-16 bg-white border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold text-forest-900">
              Frequently Asked Questions
            </h2>
            <div className="w-16 h-1 bg-gold-500 mx-auto mt-4 rounded-full" />
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ REVIEWS â”€â”€ */}
      <section
        id="reviews"
        className="py-20 bg-stone-50 border-y border-stone-200"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-extrabold text-forest-700 mb-4"
            >
              What Our Students Say
            </motion.h2>
            <p className="text-base text-stone-600 max-w-2xl mx-auto">
              Join hundreds of successful drivers who started their journey with
              us.
            </p>
            <div className="flex justify-center items-center gap-2 mt-6">
              <div className="flex text-gold-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-forest-700">
                4.9/5 based on 100+ reviews
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {reviews.map((review, i) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex text-gold-500 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-stone-700 leading-relaxed mb-6 flex-grow italic text-sm">
                  {review.text}
                </p>
                <div className="flex items-center gap-4 border-t border-stone-50 pt-6">
                  <div className="w-11 h-11 bg-blue-100 text-forest-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {review.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-forest-700 text-sm">
                      {review.name}
                    </h4>
                    <span className="text-xs text-stone-400">
                      Verified Google Review
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://www.google.com/maps/place/Kent+Discount+Driving+School/@47.387869,-122.3323323,3262m/data=!3m1!1e3!4m12!1m2!2m1!1skent+driving+school+kent+washington!3m8!1s0x54905beb9e038b7f:0xed5a861f06500aa!8m2!3d47.393019!4d-122.2968389!9m1!1b1!15sCiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvblooIiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvbpIBDmRyaXZpbmdfc2Nob29s4AEA!16s%2Fg%2F11mcc_vg_w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-forest-700 text-white font-bold px-10 py-4 rounded-full shadow-lg hover:bg-forest-800 transition-all"
              id="reviews-cta"
            >
              Read Our 100+ Google Reviews
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* â”€â”€ CONTACT â”€â”€ */}
      <section
        id="contact"
        className="py-16 bg-stone-50 border-t border-stone-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3">
              <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
                Get In Touch
              </span>
              <h2 className="text-3xl font-extrabold text-forest-900 mb-4">
                Our Kent Branch
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">
                Visit us at our primary location for official DOL testing and
                personalized driving lessons.
              </p>

              <div className="space-y-5">
                {[
                  {
                    Icon: MapPin,
                    label: "Office Location",
                    value: "23231 Pacific Hwy S,\nKent, WA 98032",
                  },
                  {
                    Icon: Phone,
                    label: "Phone Number",
                    value: "(206) 551-9748",
                    href: "tel:+12065519748",
                  },
                  {
                    Icon: Mail,
                    label: "Email Support",
                    value: "kentdiscountdriving@gmail.com",
                    href: "mailto:kentdiscountdriving@gmail.com",
                  },
                  {
                    Icon: Clock,
                    label: "Business Hours",
                    value: "Mon - Sun: 9:00 AM - 8:00 PM",
                  },
                ].map(({ Icon, label, value, href }) => (
                  <div key={label} className="flex gap-4 group">
                    <div className="shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-forest-900 text-xs mb-0.5">
                        {label}
                      </h4>
                      {href ? (
                        <a
                          href={href}
                          className="text-stone-600 text-sm hover:text-blue-600 transition-colors whitespace-pre-line"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-stone-600 text-sm whitespace-pre-line">
                          {value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=23231+Pacific+Hwy+S+Kent+WA+98032"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-forest-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-forest-800 transition-all text-sm gap-2"
                  id="directions-cta"
                >
                  <MapPin className="w-4 h-4" />
                  Get Driving Directions
                </a>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="lg:w-2/3">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200 h-80 lg:h-full min-h-[320px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2700!2d-122.2968389!3d47.393019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54905beb9e038b7f%3A0xed5a861f06500aa!2sKent%20Discount%20Driving%20School!5e0!3m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Kent Discount Driving School Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
