"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Check admin claim
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    user
      .getIdTokenResult()
      .then((r) => setIsAdmin(r.claims.admin === true))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "My Account";

  return (
    <>
      {/* -- Desktop / Tablet Nav -- */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass shadow-lg shadow-black/10"
            : "bg-gradient-to-b from-black/40 to-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 group"
              id="nav-logo"
            >
              <img
                src="/images/logo.jpg"
                alt="DDS"
                width="40"
                height="40"
                className="w-10 h-10 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="text-white font-extrabold text-lg leading-tight tracking-tight">
                Kent Discount Driving School
              </span>
            </Link>
            <a
              href="tel:+12065519748"
              className="hidden md:flex items-center gap-1 text-amber-200/80 hover:text-white text-xs font-semibold transition-colors"
            >
              <Phone className="w-3 h-3" />
              (206) 551-9748
            </a>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-bold text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}

            {/* Auth-aware CTA */}
            {!loading && !user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="ml-3 bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 transition-all active:scale-95"
                id="nav-cta-desktop"
              >
                Student Portal
              </button>
            )}

            {!loading && user && (
              <div className="relative ml-3" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-white font-bold text-sm hover:text-amber-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                  id="user-menu-button"
                >
                  <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-1 border border-stone-100 overflow-hidden"
                    >
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-navy-700 font-bold hover:bg-blue-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 font-bold hover:bg-blue-50 transition-colors border-t border-stone-100"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition-colors border-t border-stone-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Open menu"
            id="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* -- Mobile Full-Screen Menu -- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] bg-navy-900 overflow-y-auto md:hidden"
            id="mobile-menu"
          >
            <div className="p-6 sm:p-8 min-h-screen flex flex-col">
              <div className="flex items-center justify-between mb-12">
                <span className="text-blue-400 font-black tracking-[0.2em] uppercase text-xs">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-white font-black text-2xl sm:text-3xl py-4 border-b border-white/5 hover:text-amber-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="mt-8"
              >
                {!user ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthOpen(true);
                    }}
                    className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
                    id="nav-cta-mobile"
                  >
                    Student Portal
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center bg-amber-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="w-full text-center text-white/50 font-semibold py-3 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
                <a
                  href="tel:+12065519748"
                  className="mt-4 flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm font-semibold transition-colors py-3"
                >
                  <Phone className="w-4 h-4" />
                  (206) 551-9748
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => router.push("/dashboard")}
      />
    </>
  );
}
