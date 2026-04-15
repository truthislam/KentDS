"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const programLinks = [
  { href: "/services#teen", label: "Teen Driving (Kent, WA)" },
  { href: "/services#adult", label: "Adult Lessons" },
  { href: "/services#driving-test", label: "Behind-the-Wheel" },
  { href: "/services#driving-test", label: "Defensive Driving" },
  { href: "/services#knowledge-test", label: "Road Test Prep" },
];

const quickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact Us" },
  { href: "/services", label: "Book Now" },
];

const locations = [
  {
    name: "Kent",
    address: "23231 Pacific Hwy S",
    city: "Kent, WA 98032",
    phone: "(206) 851-6647",
    tel: "+12065519748",
  },
  {
    name: "Seattle",
    address: "8816 Renton Ave S",
    city: "Kent, WA 98118",
    phone: "(206) 851-6647",
    tel: "+12065519748",
  },
];

interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export default function Footer() {
  const [socials, setSocials] = useState<SocialLinks>({});

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "artifacts/kent/public/data/siteContent/socials"),
      (snap) => {
        if (snap.exists()) {
          setSocials(snap.data() as SocialLinks);
        }
      },
      (err) => {
        // Expected if doc doesn't exist yet
        console.warn("Socials read:", err.message);
      }
    );
    return unsub;
  }, []);

  const hasFacebook = !!socials.facebook?.trim();
  const hasTwitter = !!socials.twitter?.trim();
  const hasInstagram = !!socials.instagram?.trim();
  const hasAnySocial = hasFacebook || hasTwitter || hasInstagram;

  return (
    <footer className="bg-forest-900 text-white pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-white/15 flex items-center justify-center text-gold-400 font-black text-lg shadow-lg">
                DDS
              </div>
              <div>
                <h3 className="font-extrabold text-xl leading-tight uppercase tracking-tight">
                  Kent Discount
                </h3>
                <p className="text-sm text-blue-400 font-bold">
                  DRIVING SCHOOL
                </p>
              </div>
            </div>
            <p className="text-stone-300 text-sm font-medium leading-relaxed">
              Setting the standard for driver education excellence since 2008.
              State-approved, insured, and committed to your safety on the road.
            </p>

            {/* Social Icons â€” only show icons that have a URL configured */}
            {hasAnySocial && (
              <div className="flex gap-3">
                {hasFacebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1877F2] transition-all duration-300 border border-white/15 hover:border-transparent hover:scale-110"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {hasTwitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter / X"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1DA1F2] transition-all duration-300 border border-white/15 hover:border-transparent hover:scale-110"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                )}
                {hasInstagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E4405F] transition-all duration-300 border border-white/15 hover:border-transparent hover:scale-110"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-bold text-base mb-6 border-b border-blue-500/30 pb-2 inline-block">
              Programs
            </h4>
            <ul className="space-y-3">
              {programLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-stone-300 hover:text-blue-400 transition-colors text-sm font-semibold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-base mb-6 border-b border-blue-500/30 pb-2 inline-block">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-stone-300 hover:text-blue-400 transition-colors text-sm font-semibold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-bold text-base mb-6 border-b border-blue-500/30 pb-2 inline-block">
              Our Locations
            </h4>
            <div className="space-y-6">
              {locations.map((loc) => (
                <div key={loc.name} className="flex gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-white font-bold mb-0.5">{loc.name}</p>
                    <p className="text-stone-300 leading-relaxed font-medium">
                      {loc.address}
                      <br />
                      {loc.city}
                    </p>
                    <a
                      href={`tel:${loc.tel}`}
                      className="text-blue-400 mt-1.5 inline-flex items-center gap-1.5 hover:text-blue-300 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      {loc.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.15em]">
            &copy; {new Date().getFullYear()} Discount Driving School. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
