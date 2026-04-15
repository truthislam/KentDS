"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Check,
  Loader2,
  ShieldCheck,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { ServicePackage } from "@/types/packages";
import { getPaymentLink } from "@/lib/clover-payment-links";

interface BookingPortalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: ServicePackage | null;
}

const APP_ID = "kent";
const AVAIL_PATH = `artifacts/${APP_ID}/public/data/availability`;

interface AvailSlot {
  id: string;
  date: string;
  time: string;
  isBooked: boolean;
}

/* ─── Calendar helpers ─── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STEPS = [
  { label: "Select Date", icon: Calendar },
  { label: "Pick Time", icon: Clock },
  { label: "Confirm", icon: Check },
];

export default function BookingPortal({
  isOpen,
  onClose,
  selectedPackage,
}: BookingPortalProps) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [step, setStep] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedSlotId(null);
      setConfirming(false);
      setConfirmed(false);
      setError(null);
      setAvailableSlots([]);
      setCurrentMonth(new Date());
    }
  }, [isOpen]);

  const isGuestBooking = selectedPackage?.category?.includes("Test") || selectedPackage?.name?.includes("Practice");
  const isTest = selectedPackage?.category?.includes("Test");
  const requiresGuestForm = isGuestBooking && !user;

  // Fetch real availability when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    setLoadingSlots(true);

    if (true) {
      // Use an open schedule off the bat for all packages temporarily

      const testSlots: AvailSlot[] = [
        { id: `t-0900`, date: dateStr, time: "09:00 AM", isBooked: false },
        { id: `t-1000`, date: dateStr, time: "10:00 AM", isBooked: false },
        { id: `t-1100`, date: dateStr, time: "11:00 AM", isBooked: false },
        { id: `t-1200`, date: dateStr, time: "12:00 PM", isBooked: false },
        { id: `t-1300`, date: dateStr, time: "01:00 PM", isBooked: false },
        { id: `t-1400`, date: dateStr, time: "02:00 PM", isBooked: false },
        { id: `t-1500`, date: dateStr, time: "03:00 PM", isBooked: false },
        { id: `t-1600`, date: dateStr, time: "04:00 PM", isBooked: false },
        { id: `t-1700`, date: dateStr, time: "05:00 PM", isBooked: false },
        { id: `t-1800`, date: dateStr, time: "06:00 PM", isBooked: false },
        { id: `t-1900`, date: dateStr, time: "07:00 PM", isBooked: false },
      ];
      // Fake delay to feel native
      setTimeout(() => {
        setAvailableSlots(testSlots);
        setLoadingSlots(false);
      }, 400);
      return;
    }

    const ref = collection(db, AVAIL_PATH);
    const q = query(
      ref,
      where("date", "==", dateStr),
      where("isBooked", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const slots = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as AvailSlot
        );
        slots.sort((a, b) => a.time.localeCompare(b.time));
        setAvailableSlots(slots);
        setLoadingSlots(false);
      },
      (error) => {
        console.error("Error fetching slots:", error);
        setAvailableSlots([]);
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const PORTAL_STEPS = requiresGuestForm
    ? [
        { label: "Date", icon: Calendar },
        { label: "Time", icon: Clock },
        { label: "Details", icon: Check },
      ]
    : [
        { label: "Date", icon: Calendar },
        { label: "Time", icon: Clock },
        { label: "Confirm", icon: Check },
      ];

  const handleDateSelect = (day: number) => {
    const d = new Date(year, month, day);
    if (d < today) return;
    setSelectedDate(d);
    setSelectedTime(null);
    setStep(1);
  };

  const handleTimeSelect = (slot: AvailSlot) => {
    setSelectedTime(slot.time);
    setSelectedSlotId(slot.id);
    if (requiresGuestForm) {
      setStep(2);
    } else if (!user) {
      setAuthOpen(true);
    } else {
      setStep(2);
    }
  };

  const handleAuthSuccess = () => {
    setAuthOpen(false);
    setStep(2);
  };

  // Resolve payment link: use package.paymentLink if set (admin override), otherwise fall back to hardcoded Clover map
  const resolvedPaymentLink = useMemo(() => {
    if (!selectedPackage) return null;
    if (selectedPackage.paymentLink) return selectedPackage.paymentLink;
    const link = getPaymentLink(selectedPackage.id);
    // getPaymentLink returns a generic fallback if no match — treat that as "no link" for non-test packages
    if (link === "https://www.clover.com/pay" && !isTest) return null;
    return link;
  }, [selectedPackage, isTest]);

  const handleConfirm = async () => {
    if (requiresGuestForm) {
      if (!guestFirstName || !guestLastName || !guestEmail || !guestPhone) {
        setError("Please fill out all contact information.");
        return;
      }
    }
    setConfirming(true);
    setError(null);
    try {
      const functions = getFunctions();
      const bookFn = httpsCallable(functions, "bookAppointment");
      await bookFn({
        availabilityId: selectedSlotId,
        sessionType: selectedPackage?.name || "Lesson",
        guestName: requiresGuestForm
          ? `${guestFirstName.trim()} ${guestLastName.trim()}`
          : undefined,
        guestEmail: requiresGuestForm ? guestEmail.trim() : undefined,
        guestPhone: requiresGuestForm ? guestPhone.trim() : undefined,
        // All bookings use virtual slot IDs — pass date/time so backend can create real slots
        requestedDate: selectedDate
            ? selectedDate.toISOString().split("T")[0]
            : undefined,
        requestedTime: selectedTime,
      });
      setConfirmed(true);

      // Auto-redirect to payment for tests — use resolved link (covers hardcoded Clover map + admin overrides)
      if (isTest && resolvedPaymentLink) {
        setTimeout(() => {
          window.location.href = resolvedPaymentLink;
        }, 1500);
      }
    } catch (err: any) {
      const msg = err?.message || "Booking failed. Please try again.";
      setError(msg);
    }
    setConfirming(false);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  if (!selectedPackage) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            id="booking-portal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[900px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* ── Header ── */}
              <div className="px-5 pt-5 pb-4 border-b border-stone-100 bg-gradient-to-b from-white to-stone-50/50 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-blue-600">
                      Booking Portal
                    </p>
                    <h2 className="text-lg font-extrabold text-forest-900 mt-0.5">
                      {selectedPackage.name}
                    </h2>
                    <p className="text-sm text-stone-500 mt-0.5">
                      ${selectedPackage.price} — {selectedPackage.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                {/* Stepper */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {PORTAL_STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = i === step;
                    const isDone = i < step || confirmed;
                    return (
                      <div
                        key={s.label}
                        className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-bold transition-all ${
                          isDone
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : isActive
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-white border-stone-200 text-stone-400"
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-auto p-5">
                <AnimatePresence mode="wait">
                  {/* STEP 0: Calendar */}
                  {step === 0 && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Month nav */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={prevMonth}
                          className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-forest-700">
                          {MONTH_NAMES[month]} {year}
                        </h3>
                        <button
                          onClick={nextMonth}
                          className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Day labels */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (d) => (
                            <div
                              key={d}
                              className="text-center text-xs font-bold text-stone-400 py-1"
                            >
                              {d}
                            </div>
                          )
                        )}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`e-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const d = new Date(year, month, day);
                          const isPast = d < today;
                          const isSelected =
                            selectedDate?.toDateString() === d.toDateString();
                          const isToday =
                            d.toDateString() === today.toDateString();
                          const disabled = isPast;

                          return (
                            <button
                              key={day}
                              onClick={() => !disabled && handleDateSelect(day)}
                              disabled={disabled}
                              className={`aspect-square rounded-xl text-sm font-bold transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                  : disabled
                                    ? "text-stone-300 cursor-not-allowed"
                                    : isToday
                                      ? "bg-gold-50 text-gold-700 border border-gold-200 hover:bg-gold-100"
                                      : "text-stone-700 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 1: Time Slots */}
                  {step === 1 && (
                    <motion.div
                      key="timeslots"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => setStep(0)}
                        className="text-sm text-blue-600 font-bold mb-4 flex items-center gap-1 hover:underline"
                      >
                        <ChevronLeft className="w-4 h-4" /> Change Date
                      </button>
                      <h3 className="font-bold text-forest-700 mb-1">
                        {selectedDate?.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <p className="text-sm text-stone-500 mb-4">
                        Select an available time slot
                      </p>

                      {loadingSlots ? (
                        <div className="text-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-stone-300 mx-auto" />
                          <p className="text-stone-400 text-sm mt-2">
                            Loading available slots…
                          </p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-stone-400 text-center py-12 font-semibold">
                          No slots available on this day.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <motion.button
                              key={slot.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTimeSelect(slot)}
                              className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                selectedTime === slot.time
                                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                  : "bg-white border-stone-200 text-stone-700 hover:border-blue-400 hover:text-blue-700"
                              }`}
                            >
                              {slot.time}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2: Confirmation / Details */}
                  {step === 2 && !confirmed && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => setStep(1)}
                        className="text-sm text-stone-500 font-bold mb-6 flex items-center gap-1 hover:text-stone-800"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to times
                      </button>

                      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-500">
                              Selected Slot
                            </p>
                            <p className="font-extrabold text-forest-900 text-lg">
                              {selectedDate?.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at {selectedTime}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-stone-500 bg-white p-4 rounded-xl border border-stone-200">
                          {selectedPackage.name}
                        </p>
                      </div>

                      {requiresGuestForm && (
                        <div className="mt-6 space-y-4">
                          <h4 className="text-sm font-bold text-forest-800 uppercase tracking-widest pl-1">
                            Your Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <input
                                type="text"
                                value={guestFirstName}
                                onChange={(e) =>
                                  setGuestFirstName(e.target.value)
                                }
                                placeholder="First Name *"
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={guestLastName}
                                onChange={(e) =>
                                  setGuestLastName(e.target.value)
                                }
                                placeholder="Last Name *"
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <input
                                type="tel"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder="Phone Number *"
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <input
                                type="email"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                placeholder="Email Address *"
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p>{error}</p>
                        </div>
                      )}

                      <div className="mt-8">
                        <button
                          onClick={handleConfirm}
                          disabled={confirming}
                          className="relative w-full overflow-hidden rounded-xl bg-blue-600 text-white font-bold text-lg py-4 transition-all hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                          {confirming ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </div>
                          ) : requiresGuestForm ? (
                            "Confirm & Continue to Payment"
                          ) : (
                            "Confirm Booking"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* SUCCESS STATE */}
                  {confirmed && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-10 text-center"
                    >
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-10 h-10 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-black text-forest-900 mb-2">
                        {isTest ? "Booking Saved!" : "Booking Confirmed!"}
                      </h3>
                      <p className="text-stone-500 max-w-[280px] leading-relaxed">
                        {isTest && resolvedPaymentLink
                          ? "Redirecting you to the payment page..."
                          : "We've added this appointment to your schedule. See you then!"}
                      </p>
                      {isTest && resolvedPaymentLink && (
                        <a
                          href={resolvedPaymentLink}
                          className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-400 text-white font-bold rounded-xl shadow-lg shadow-gold-500/20 transition-all"
                        >
                          <CreditCard className="w-5 h-5" />
                          Pay Now on Clover
                        </a>
                      )}
                      {(!isTest || !resolvedPaymentLink) && (
                        <button
                          onClick={onClose}
                          className="mt-8 px-8 py-3 bg-stone-100 hover:bg-stone-200 text-forest-800 font-bold rounded-xl transition-colors"
                        >
                          Close Portal
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth gate */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode="signup"
      />
    </>
  );
}
