"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, Calendar, AlertCircle, Loader2, CreditCard, User, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { db, auth as fAuth } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, writeBatch } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import AuthModal from "./AuthModal";
import type { ServicePackage } from "@/types/packages";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentLink } from "@/lib/clover-payment-links";
import {
  type TeenSession,
  generateAllDefaultSessions,
  formatSessionLabel,
} from "@/lib/teen-sessions";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: ServicePackage | null;
}

const SESSIONS_PATH = "artifacts/kent/public/data/teen_sessions";

export default function EnrollmentModal({ isOpen, onClose, selectedPackage }: EnrollmentModalProps) {
  const { user, signup, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<"schedule" | "account" | "payment" | "processing">("schedule");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessions, setSessions] = useState<TeenSession[]>([]);
  const [selectedSessionType, setSelectedSessionType] = useState<"Weekday" | "Weekend">("Weekday");
  const [selectedSession, setSelectedSession] = useState<TeenSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Registration Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isTeenPackage = selectedPackage?.category === "Teen-Packages";

  // ─── Fetch or auto-seed teen sessions from Firestore ───
  const fetchTeenSessions = async () => {
    setLoadingSessions(true);
    try {
      const snap = await getDocs(collection(db, SESSIONS_PATH));
      const todayStr = new Date().toISOString().split("T")[0];

      // Helper: seed fresh sessions into Firestore
      const seedFreshSessions = async () => {
        const defaults = generateAllDefaultSessions(6);
        const batch = writeBatch(db);
        const seeded: TeenSession[] = [];
        for (const session of defaults) {
          const ref = doc(collection(db, SESSIONS_PATH));
          batch.set(ref, session);
          seeded.push({ ...session, id: ref.id });
        }
        await batch.commit();
        return seeded.sort((a, b) => a.startDate.localeCompare(b.startDate));
      };

      if (snap.empty) {
        // First time — auto-seed with smart defaults
        setSessions(await seedFreshSessions());
      } else {
        const loaded: TeenSession[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeenSession));
        // Only show future sessions that are active
        const futureSessions = loaded
          .filter(s => s.isActive !== false && s.startDate >= todayStr)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (futureSessions.length === 0) {
          // All sessions have expired — delete old docs and re-seed fresh ones
          const deleteBatch = writeBatch(db);
          snap.docs.forEach(d => deleteBatch.delete(d.ref));
          await deleteBatch.commit();
          setSessions(await seedFreshSessions());
        } else {
          setSessions(futureSessions);
        }
      }
    } catch (err) {
      console.error("Failed to load teen sessions", err);
    }
    setLoadingSessions(false);
  };

  // ─── Enrollment logic ───
  const processEnrollment = async (userId: string = user?.uid!) => {
    if (!userId || !selectedPackage) return;
    setError(null);
    try {
      const studentRef = doc(db, "artifacts/kent/public/data/students", userId);

      const enrolledPackageData: any = {
        id: selectedPackage.id,
        name: selectedPackage.name,
        requiredDrives: selectedPackage.requiredDrives || selectedPackage.hours || 0,
        paymentStatus: "pending",
      };

      if (isTeenPackage && selectedSession) {
        enrolledPackageData.teenSession = {
          id: selectedSession.id,
          type: selectedSession.type,
          startDate: selectedSession.startDate,
          endDate: selectedSession.endDate,
          scheduleDisplay: selectedSession.scheduleDisplay,
        };
      }

      await setDoc(studentRef, {
        enrolledPackage: enrolledPackageData,
        paymentStatus: "pending",
      }, { merge: true });

      if (!isNewRegistration) {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Failed to enroll. Please try again.");
    }
  };

  // ─── Effects ───
  useEffect(() => {
    if (isOpen && isTeenPackage) {
      setStep("schedule");
      setSelectedSession(null);
      fetchTeenSessions();
    } else if (isOpen) {
      setStep("account");
    }
  }, [isOpen, isTeenPackage]);

  useEffect(() => {
    if (user && isOpen && selectedPackage && !isNewRegistration) {
      if (isTeenPackage && !selectedSession) {
        setStep("schedule");
      } else if (step !== "processing" && step !== "payment") {
        processEnrollment();
      }
    }
  }, [user, isOpen, selectedSession, isTeenPackage, selectedPackage, step, isNewRegistration]);

  // ─── Form handler ───
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (email.toLowerCase() !== confirmEmail.toLowerCase()) return setError("Emails do not match.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setSubmitting(true);
    try {
      setIsNewRegistration(true);
      await signup(email, password, firstName.trim(), lastName.trim());

      const uid = fAuth.currentUser?.uid;
      if (uid) {
        const studentRef = doc(db, "artifacts/kent/public/data/students", uid);
        await updateDoc(studentRef, {
          phoneNumber: phone,
          address: { street: streetAddress, city, zip: zipCode },
        });
        await processEnrollment(uid);
        setStep("payment");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSessionSelect = (session: TeenSession) => {
    setSelectedSession(session);
    if (user) {
      // Already logged in — skip to enrollment
      processEnrollment();
    } else {
      setStep("account");
    }
  };

  if (!isOpen || !selectedPackage) return null;

  // ─── Filter sessions by type ───
  const filteredSessions = sessions.filter(s => s.type === selectedSessionType);

  // ─── Step number for indicator ───
  const stepNum = step === "schedule" ? 1 : step === "account" ? 2 : 3;

  // ─── 3-step stepper (matches client mockup) ───
  const STEP_LABELS = isTeenPackage
    ? [{ num: 1, label: "Schedule" }, { num: 2, label: "Account" }, { num: 3, label: "Payment" }]
    : [{ num: 1, label: "Account" }, { num: 2, label: "Payment" }, { num: 3, label: "Finish" }];

  const renderStepsIndicator = (current: number) => (
    <div className="flex items-center gap-2 mb-6">
      {STEP_LABELS.map((s) => (
        <div
          key={s.num}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
            current === s.num
              ? "bg-blue-50 border-blue-200 text-blue-700 font-bold"
              : current > s.num
              ? "bg-emerald-50 border-emerald-200 text-emerald-600 font-bold"
              : "bg-white border-stone-100 text-stone-400"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              current === s.num
                ? "bg-blue-600 text-white"
                : current > s.num
                ? "bg-emerald-500 text-white"
                : "bg-stone-200 text-stone-500"
            }`}
          >
            {current > s.num ? "✓" : s.num}
          </div>
          <span className="text-xs">{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {/* ═══ STEP 1: Schedule Selection (Teen only) ═══ */}
        {isOpen && step === "schedule" && isTeenPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-stone-100 bg-gradient-to-b from-white to-stone-50/50 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-blue-600">
                      {selectedPackage.name}
                    </p>
                    <h2 className="text-xl font-extrabold text-forest-900 mt-0.5">
                      Choose Your Class Schedule
                    </h2>
                    <p className="text-sm text-stone-500 mt-0.5">
                      Select between a Weekday or Weekend session.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                {/* Stepper */}
                <div className="mt-4">{renderStepsIndicator(1)}</div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-6">
                {/* Weekday / Weekend Toggle */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  {(["Weekday", "Weekend"] as const).map((type) => {
                    const isActive = selectedSessionType === type;
                    const info =
                      type === "Weekday"
                        ? { days: "MON, TUE, WED", time: "5pm - 7pm" }
                        : { days: "SAT, SUN", time: "4pm - 6pm" };
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedSessionType(type)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? "border-blue-500 bg-blue-50/60 shadow-sm"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <p className={`text-sm font-extrabold ${isActive ? "text-forest-900" : "text-stone-700"}`}>
                          {type.toUpperCase()}
                        </p>
                        <p className={`text-xs mt-1 font-bold ${isActive ? "text-blue-600" : "text-stone-400"}`}>
                          {info.days}
                        </p>
                        <p className={`text-xs ${isActive ? "text-stone-600" : "text-stone-400"}`}>
                          {info.time}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Session selection label */}
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                  Select {selectedSessionType.toLowerCase()} start date
                </p>

                {/* Session Dropdown List */}
                {loadingSessions ? (
                  <div className="py-12 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-stone-500 font-medium">Loading schedules...</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="py-12 bg-stone-50 rounded-xl text-center border border-stone-100">
                    <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500 font-bold">
                      No {selectedSessionType.toLowerCase()} courses available.
                    </p>
                    <p className="text-stone-400 text-xs mt-1">Check back soon or try the other option.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map((session) => {
                      const isSelected = selectedSession?.id === session.id;
                      const isFull = session.enrolled >= session.capacity;
                      return (
                        <button
                          key={session.id}
                          onClick={() => !isFull && setSelectedSession(session)}
                          disabled={isFull}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between ${
                            isFull
                              ? "border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? "border-blue-500 bg-blue-50/50 shadow-sm"
                              : "border-stone-100 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${isSelected ? "text-forest-900" : "text-stone-700"}`}>
                              {formatSessionLabel(session)}
                            </p>
                            {isFull && (
                              <p className="text-xs text-red-500 font-bold mt-0.5">Session Full</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 ml-3">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next Step Button */}
              <div className="px-6 pb-6 pt-2 shrink-0 border-t border-stone-100">
                <button
                  onClick={() => selectedSession && handleSessionSelect(selectedSession)}
                  disabled={!selectedSession}
                  className="w-full flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg text-sm"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ STEP 2: Create Account ═══ */}
        {isOpen && step === "account" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6 bg-stone-900/40 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[800px] bg-white rounded-2xl shadow-2xl flex flex-col my-auto"
            >
              <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-stone-100 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-1">
                    {selectedPackage.name}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-forest-900">Create Account</h2>
                  <p className="text-stone-500 text-sm mt-1">
                    {isTeenPackage ? "Step 2 of 3" : "Step 1 of 3"} — create your account to get started.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 -mr-2 -mt-2 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {renderStepsIndicator(isTeenPackage ? 2 : 1)}

                {/* Selected session summary (Teen only) */}
                {isTeenPackage && selectedSession && (
                  <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-4 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Selected Session</p>
                      <p className="text-sm font-bold text-forest-900 truncate">
                        {formatSessionLabel(selectedSession)}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedSession(null); setStep("schedule"); }}
                      className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 text-center mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">ENROLLING IN</p>
                  <p className="text-lg font-bold text-indigo-900">{selectedPackage.name}</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-6">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="text" placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="email" placeholder="Email Address *" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="email" placeholder="Confirm Email *" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="text" placeholder="Street Address" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-2" />
                    <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="text" placeholder="Zip Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="Password (Min 6 chars) *" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-11 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password *" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 pr-11 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-50 text-sm"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </button>
                  </div>
                </form>

                {/* OR divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-xs font-bold text-stone-400 uppercase">OR</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                      // Google sign-in doesn't go through the form flow,
                      // so processEnrollment will be triggered by the useEffect
                    } catch (err: any) {
                      setError(err?.message || "Google sign-in failed.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold py-3.5 rounded-xl transition-all text-sm shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>

                <p className="text-center text-xs text-stone-500 pt-3">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ STEP 3: Payment ═══ */}
        {isOpen && step === "payment" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6 bg-stone-900/40 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[800px] bg-white rounded-2xl shadow-2xl flex flex-col my-auto"
            >
              <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-stone-100 flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-1">
                    {selectedPackage.name}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-forest-900">Secure Payment</h2>
                  <p className="text-stone-500 text-sm mt-1">
                    {isTeenPackage ? "Step 3 of 3" : "Step 2 of 3"} — secure your spot with payment.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 -mr-2 -mt-2 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="p-6 sm:p-8 text-center flex flex-col items-center">
                <div className="w-full max-w-lg mx-auto">{renderStepsIndicator(isTeenPackage ? 3 : 2)}</div>

                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-forest-900 mb-2">Account Created!</h3>
                <p className="text-stone-500 mb-6 max-w-sm">
                  We&apos;re enrolling you in the <strong>{selectedPackage.name}</strong>. Please complete your payment
                  to finalize registration.
                </p>

                <button
                  onClick={() => {
                    sessionStorage.setItem('pendingEnrollment', JSON.stringify({
                      packageId: selectedPackage.id,
                      packageName: selectedPackage.name,
                      packagePrice: selectedPackage.price,
                    }));
                    const finalLink = getPaymentLink(selectedPackage.id);
                    window.open(finalLink, "_self");
                  }}
                  className="w-full max-w-sm flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-black py-4 rounded-xl shadow-lg border border-gold-600 transition-all text-base mb-4"
                >
                  <CreditCard className="w-6 h-6" /> Pay Securely on Clover
                </button>

                <button
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                  className="text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Skip for now &amp; go to dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal for Existing Users */}
      {showLoginModal && (
        <AuthModal
          isOpen={true}
          initialMode="login"
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
          }}
        />
      )}
    </>
  );
}
