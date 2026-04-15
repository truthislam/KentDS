"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getFunctions, httpsCallable } from "firebase/functions";

const contactInfo = [
  { Icon: MapPin, label: "Office Location", value: "8816 Renton Ave S,\nKent, WA 98118" },
  { Icon: Phone, label: "Phone Number", value: "(206) 551-9748", href: "tel:+12065519748" },
  { Icon: Mail, label: "Email Support", value: "kentdiscountdriving@gmail.com", href: "mailto:kentdiscountdriving@gmail.com" },
  { Icon: Clock, label: "Business Hours", value: "Mon – Sun: 9:00 AM – 8:00 PM" },
];

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem("contact-name") as HTMLInputElement).value,
      organization: (form.elements.namedItem("contact-org") as HTMLInputElement).value,
      email: (form.elements.namedItem("contact-email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("contact-phone") as HTMLInputElement).value,
      subject: (form.elements.namedItem("contact-subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("contact-message") as HTMLTextAreaElement).value,
    };

    try {
      const functions = getFunctions();
      const submitFn = httpsCallable(functions, "submitContactForm");
      await submitFn(data);
      
      setStatus("success");
      form.reset();
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <>
      <PageHero
        title="Get In Touch"
        subtitle="We're here to help you on your journey to becoming a confident driver."
      />

      {/* Info + Map */}
      <section className="py-16 bg-stone-50 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3">
              <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
                Our Location
              </span>
              <h2 className="text-3xl font-bold text-forest-700 mb-4">
                Our Kent Branch
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">
                Visit us at our primary location for official DOL testing and
                personalized driving lessons.
              </p>

              <div className="space-y-5">
                {contactInfo.map(({ Icon, label, value, href }) => (
                  <div key={label} className="flex gap-4 group">
                    <div className="shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-forest-700 text-xs mb-0.5">
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
                  id="contact-directions-cta"
                >
                  <MapPin className="w-4 h-4" />
                  Get Driving Directions
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="lg:w-2/3">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200 h-80 lg:h-full min-h-[320px] relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2694.757041530669!2d-122.30232238437021!3d47.39707257917088!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54905ea5d09f7a41%3A0xfa9ab3fa132d7ab!2s23231%20Pacific%20Hwy%20S%2C%20Kent%2C%20WA%2098032!5e0!3m2!1sen!2sus!4v1689625372951!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Discount Driving School Seattle Location"
                />
                {/* Map legend */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-lg flex items-center pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-forest-700 tracking-tight">
                      Open Now • Walk-ins Welcome
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-stone-50 border-t border-stone-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
              Organizations &amp; Partners
            </span>
            <h2 className="text-3xl font-bold text-forest-700 mb-4">
              Send Us a Message
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed max-w-2xl mx-auto">
              Interested in partnering with us or have a question for our team?
              Fill out the form below and we&apos;ll get back to you as soon as
              possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" id="contact-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-bold text-forest-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  required
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="contact-org" className="block text-sm font-bold text-forest-700 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  id="contact-org"
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm"
                  placeholder="Company or organization name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-bold text-forest-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="contact-email"
                  required
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-bold text-forest-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm"
                  placeholder="(206) 555-1234"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-sm font-bold text-forest-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contact-subject"
                required
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm"
                placeholder="What is this regarding?"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm font-bold text-forest-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={6}
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none shadow-sm"
                placeholder="Tell us how we can help..."
              />
            </div>

            <div className="text-center">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={status === "sending"}
                className="bg-gold-500 text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:bg-gold-400 transition-all disabled:opacity-60 text-base inline-flex items-center gap-2"
                id="contact-submit-btn"
              >
                {status === "sending" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-5 h-5" /> Send Message</>
                )}
              </motion.button>
            </div>

            {status === "success" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-green-600 font-bold text-base"
              >
                ✓ Message sent successfully! We&apos;ll get back to you soon.
              </motion.p>
            )}
            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-red-600 font-bold text-base"
              >
                ✗ Something went wrong. Please try again or call us directly.
              </motion.p>
            )}
          </form>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a
          href="tel:+12065519748"
          className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all active:scale-95"
          title="Call Us"
        >
          <Phone className="w-6 h-6" />
        </a>
        <a
          href="mailto:kentdiscountdriving@gmail.com"
          className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all active:scale-95"
          title="Email Us"
        >
          <Mail className="w-6 h-6" />
        </a>
      </div>
    </>
  );
}
