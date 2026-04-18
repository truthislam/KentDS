"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Monitor,
  DollarSign,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import PageHero from "@/components/PageHero";

const stats = [
  { value: "15+", label: "Years Experience", border: "border-gold-500" },
  { value: "100%", label: "State Certified", border: "border-blue-600" },
  { value: "100+", label: "5-Star Reviews", border: "border-emerald-500" },
  { value: "4.9★", label: "Google Rating", border: "border-gold-400" },
];

const whyUs = [
  { Icon: ShieldCheck, title: "State-Approved Testing", desc: "Gain peace of mind knowing you're learning at a fully certified testing center for both the official knowledge and driving exams." },
  { Icon: Users, title: "Expert Instructors", desc: "Learn from our team of patient, certified, and supportive instructors who are passionately dedicated to your success on the road." },
  { Icon: Monitor, title: "Flexible Learning", desc: "Master driving on your terms. We offer certified online driving courses and engaging in-person lessons to fit your unique schedule." },
  { Icon: DollarSign, title: "Affordable Pricing", desc: "Get the best value on your journey to getting licensed with transparent, competitive pricing and no hidden fees." },
  { Icon: Star, title: "Highly Rated", desc: (
    <>
      Join hundreds of satisfied students who have successfully earned their licenses.{" "}
      <a 
        href="https://www.google.com/maps/place/Kent+Discount+Driving+School/@47.387869,-122.3323323,3262m/data=!3m1!1e3!4m12!1m2!2m1!1skent+driving+school+kent+washington!3m8!1s0x54905beb9e038b7f:0xed5a861f06500aa!8m2!3d47.393019!4d-122.2968389!9m1!1b1!15sCiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvblooIiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvbpIBDmRyaXZpbmdfc2Nob29s4AEA!16s%2Fg%2F11mcc_vg_w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D"
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
      >
        Read our Google Reviews →
      </a>
    </>
  ) },
  { Icon: Clock, title: "Easy Scheduling", desc: "Take control of your learning with 24/7 access to our online portal to book lessons and tests that fit your life." },
];

const reviews = [
  { initials: "MW", name: "Marcus Washington", text: '"Highly recommend Kent Discount Driving School! The instructors were very patient with me. I passed my road test on the first try with a high score. They made learning how to drive a breeze."' },
  { initials: "AK", name: "Amira Khan", text: '"I had a fantastic experience here. As an adult learner, I was really nervous, but they took the time to explain all the rules of the road. Their online scheduling system is super convenient."' },
  { initials: "JL", name: "Jason Lee", text: '"The best driving school in the Kent area. They really prepare you for real-world driving, not just how to pass the test. The cars are clean and the staff is extremely professional."' },
  { initials: "SG", name: "Sarah Gutierrez", text: '"My teen daughter took her lessons here and we couldn\'t be happier. The instructors are very thorough and prioritize safety above everything else. Great communication throughout the course."' },
  { initials: "DB", name: "David Brooks", text: '"Very affordable packages and excellent service. I was able to get my license quickly thanks to their flexible scheduling. Highly recommend them if you want to learn driving the right way."' },
  { initials: "NP", name: "Nadia Petrov", text: '"Thank you Kent Discount Driving School! They helped me overcome my fear of driving on the highway. The instructors are incredibly supportive and genuinely care about their students\' success."' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="Our Mission is Your Safety"
        subtitle="Setting the standard for driver education excellence in Kent since 2008."
      />

      {/* About Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-forest-700">
              A Trusted Partner for Kent drivers
            </h2>
            <div className="space-y-4 text-base text-stone-600 leading-relaxed">
              <p>
                Welcome to Discount Driving School, your dedicated partner on the
                road to becoming a safe and confident driver for life. Serving the
                Kent community, our mission is to provide a supportive, patient,
                and professional learning environment where every student can thrive.
              </p>
              <p>
                We understand that the road to getting your license can feel
                overwhelming. That&apos;s why we&apos;ve designed a curriculum that
                balances technical skill with defensive driving intuition. Whether
                you are a teen getting behind the wheel for the first time or an
                adult looking to sharpen your skills, our personalized approach
                ensures you receive the exact guidance you need.
              </p>
              <p className="font-semibold text-forest-700">
                We are more than just a school; we are a fully state-approved and
                licensed Department of Licensing (DOL) testing center, handling both
                your knowledge and skills exams in-house.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {stats.map((s) => (
                <div key={s.label} className={`border-l-4 ${s.border} pl-4`}>
                  <p className="text-3xl font-bold text-forest-700">{s.value}</p>
                  <p className="text-xs font-bold text-stone-500 uppercase">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl relative z-10 aspect-[4/3] w-full bg-stone-100">
              <Image
                src="/images/instructor.jpg"
                alt="Friendly Discount Driving School instructor standing in testing lot"
                fill
                className="object-cover object-[center_35%] group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl pointer-events-none" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-gold-500 rounded-3xl z-0 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-white py-20 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-forest-700 mb-4">
            Why Drive With Us?
          </h2>
          <p className="text-base text-stone-600 max-w-3xl mx-auto mb-12">
            Experience the difference with a driving school that puts you first.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyUs.map((feat, i) => (
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
                <h3 className="font-bold text-lg text-forest-700">{feat.title}</h3>
                <p className="text-stone-600 mt-2 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 bg-stone-50 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-forest-700 mb-4">
              Real Success Stories
            </h2>
            <p className="text-base text-stone-600 max-w-2xl mx-auto">
              Don&apos;t just take our word for it — listen to the students who
              have transformed their lives through our Kent driving programs.
            </p>
            <div className="flex justify-center items-center gap-2 mt-6">
              <div className="flex text-gold-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-forest-700">4.9/5 Average Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex text-gold-500 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-stone-700 leading-relaxed mb-6 flex-grow italic text-sm">
                  {r.text}
                </p>
                <div className="flex items-center gap-4 border-t border-stone-50 pt-6">
                  <div className="w-10 h-10 bg-blue-100 text-forest-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {r.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-forest-700 text-sm">{r.name}</h4>
                    <span className="text-xs text-stone-400">
                      Verified Google Review
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a
              href="https://www.google.com/maps/place/Kent+Discount+Driving+School/@47.387869,-122.3323323,3262m/data=!3m1!1e3!4m12!1m2!2m1!1skent+driving+school+kent+washington!3m8!1s0x54905beb9e038b7f:0xed5a861f06500aa!8m2!3d47.393019!4d-122.2968389!9m1!1b1!15sCiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvblooIiZrZW50IGRyaXZpbmcgc2Nob29sIHNlYXR0bGUgd2FzaGluZ3RvbpIBDmRyaXZpbmdfc2Nob29s4AEA!16s%2Fg%2F11mcc_vg_w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-forest-700 text-white font-bold px-10 py-4 rounded-full shadow-lg hover:bg-forest-800 transition-all"
              id="about-reviews-cta"
            >
              Read All 100+ Google Reviews
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
