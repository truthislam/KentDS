"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight, Phone } from "lucide-react";
import PageHero from "@/components/PageHero";

interface BlogSection {
  heading: string;
  body: string;
  fix?: string;
  list?: string[];
}

const blogPosts: Array<{
  id: string;
  tag: string;
  tagColor: string;
  readTime: string;
  date: string;
  image: string;
  title: string;
  intro: string;
  sections: BlogSection[];
}> = [
  {
    id: "road-test-mistakes",
    tag: "DOL Test Prep",
    tagColor: "bg-blue-100 text-blue-800",
    readTime: "5 Min Read",
    date: "Jan 4, 2026",
    image: "/images/driving test img.webp",
    title:
      "Top 5 Reasons Students Fail the Kent DOL Road Test (And How to Avoid Them)",
    intro:
      "Taking your driving test in Kent can be stressful, with our unique hilly terrain, busy bike lanes, and unpredictable weather. At Discount Driving School, we've helped hundreds of students pass their exams by focusing on the small details that examiners watch for most.",
    sections: [
      {
        heading: '1. Poor Observation & "The SMOG Technique"',
        body: "The most common point deduction comes from not checking your surroundings frequently enough. Washington examiners expect to see active head movement, not just glancing with your eyes.",
        fix: "Use the SMOG acronym: Signal, Mirror, Over-the-shoulder, and Go. Always perform a physical head-check into your blind spot before every lane change or turn.",
      },
      {
        heading: "2. Rolling Stops at Red Lights and Signs",
        body: 'Many experienced drivers pick up the "California Stop" habit, but for a test, this is an automatic failure.',
        fix: 'You must come to a complete 3-second stop behind the white stop line. If your view is blocked, stop fully first, then "creep" forward to check for traffic before proceeding.',
      },
      {
        heading: "3. Inadequate Speed Management",
        body: "in Kent, speed limits can change quickly, especially near school zones or parks like Green River Trail area or Kent Station area.",
        fix: "Always look for the nearest speed limit sign. Remember that in residential areas of Seattle, the limit is often 20 mph unless otherwise posted.",
      },
      {
        heading: "4. Improper Lane Positioning During Turns",
        body: 'Students often "wide-turn" into the wrong lane or cut corners.',
        fix: "Always turn into the lane closest to you (left lane to left lane, right lane to right lane). Keep your vehicle centered.",
      },
      {
        heading: '5. Lack of Confidence in "Parallel Parking"',
        body: "Parallel parking is a mandatory part of the Washington State skills test. Many students panic and hit the curb.",
        fix: 'Practice with our certified instructors using the same school cars you can use for your test. We teach a "reference point" system that makes parking simple.',
      },
    ],
  },
  {
    id: "teen-driving-laws",
    tag: "Parent's Guide",
    tagColor: "bg-gold-100 text-gold-800",
    readTime: "4 Min Read",
    date: "Jan 4, 2026",
    image: "/images/blog-teen-img.webp",
    title: "A Parent's Guide to Seattle Teen Driving Laws in 2026",
    intro:
      "Navigating the transition from passenger to driver is a major milestone for any Seattle family. With Washington State's specific traffic laws and the unique challenges of driving in the Pacific Northwest, staying informed is the first step toward safety.",
    sections: [
      {
        heading: "New 2026 Requirement",
        body: "Starting May 1, 2026, all new drivers under 25 must complete a mandatory online first responder and work zone safety course. This is a critical update that parents in the Seattle area need to be aware of.",
      },
      {
        heading: 'The "100 Deadliest Days"',
        body: "Statistics show that Memorial Day through Labor Day is the highest-risk period for teen drivers in Washington. During these summer months, extra caution and advanced defensive driving training are more important than ever.",
      },
      {
        heading: "Intermediate License (IDL) Recap",
        body: "Washington's IDL rules are strict to keep young drivers safe.",
        list: [
          "No passengers under 20 (for the first 6 months)",
          "No driving between 1 a.m. and 5 a.m.",
          "Zero tolerance for cell phone use, even hands-free",
        ],
      },
      {
        heading: "City-Specific Challenges",
        body: 'Navigating the Seattle "S-curves" on I-5 or handling heavy traffic on I-405 and SR-167 requires more than just basic skills. Our expert instructors specialize in training teens for these specific local conditions.',
      },
    ],
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        title="Expert Driving Tips & Local News"
        subtitle="Your resource for mastering Kent's roads and passing your DOL test with confidence."
      />

      <main className="py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-24">
          {/* Blog Posts */}
          {blogPosts.map((post, pi) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100"
            >
              {/* Post Image */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              <div className="p-8 md:p-12">
                {/* Meta */}
                <div className="flex items-center gap-4 mb-6 text-sm flex-wrap">
                  <span
                    className={`${post.tagColor} px-3 py-1 rounded-full font-bold`}
                  >
                    {post.tag}
                  </span>
                  <span className="text-stone-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                  <span className="text-stone-500">{post.date}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-forest-700 mb-6 leading-tight">
                  {post.title}
                </h2>

                <div className="space-y-6 text-base leading-relaxed text-stone-600">
                  <p>{post.intro}</p>

                  <div className="space-y-8 mt-8">
                    {post.sections.map((s) => (
                      <div key={s.heading}>
                        <h3 className="text-xl font-extrabold text-forest-700 mb-3">
                          {s.heading}
                        </h3>
                        <p>{s.body}</p>
                        {s.fix && (
                          <p className="mt-2 font-bold text-forest-600">
                            The Fix:{" "}
                            <span className="font-medium text-stone-600">
                              {s.fix}
                            </span>
                          </p>
                        )}
                        {s.list && (
                          <ul className="list-disc ml-6 mt-2 space-y-2 font-semibold">
                            {s.list.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}

          {/* Mid-Post CTA */}
          <section className="bg-blue-50 border-y border-blue-100 py-12 px-8 rounded-3xl flex flex-col items-center text-center">
            <h3 className="text-3xl md:text-4xl font-extrabold text-forest-700 mb-6">
              Ready to Pass on Your First Try?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
              <div className="space-y-4">
                <p className="text-stone-500 font-bold uppercase tracking-wider text-xs">
                  Explore our Services
                </p>
                <Link
                  href="/services"
                  className="block bg-gold-500 text-white font-extrabold py-4 rounded-xl shadow-lg hover:bg-gold-400 transition-all active:scale-95 text-lg"
                >
                  View All Packages
                </Link>
              </div>
              <div className="space-y-4">
                <p className="text-stone-500 font-bold uppercase tracking-wider text-xs">
                  Book Your Test
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/services#knowledge-test"
                    className="flex-1 bg-white text-forest-700 border-2 border-forest-700/10 font-extrabold py-4 rounded-xl hover:bg-blue-50 transition-all active:scale-95 text-base"
                  >
                    Knowledge
                  </Link>
                  <Link
                    href="/services#driving-test"
                    className="flex-1 bg-white text-forest-700 border-2 border-forest-700/10 font-extrabold py-4 rounded-xl hover:bg-blue-50 transition-all active:scale-95 text-base"
                  >
                    Driving
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-blue-100 w-full max-w-lg">
              <p className="text-stone-600 font-semibold mb-2">
                Call our Seattle Office:
              </p>
              <a
                href="tel:2068516647"
                className="text-2xl md:text-3xl font-extrabold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-3 justify-center"
              >
                <Phone className="w-6 h-6" />
                (206) 551-9748
              </a>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="bg-forest-700 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                Ready to Pass on Your First Try?
              </h2>
              <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
                Don&apos;t leave your license to chance. Join Kent&apos;s
                top-rated driving school today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  href="/services"
                  className="w-full sm:w-auto bg-gold-500 text-white font-extrabold px-10 py-4 rounded-2xl shadow-xl hover:bg-gold-400 transition-all active:scale-95 text-lg inline-flex items-center gap-2 justify-center"
                >
                  View All Packages
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="tel:2068516647"
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white border-2 border-white/20 font-extrabold px-10 py-4 rounded-2xl shadow-xl hover:bg-white/20 transition-all active:scale-95 text-lg"
                >
                  (206) 551-9748
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
