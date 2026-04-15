"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  BookOpen,
  Car,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
  LogOut,
  Edit3,
  X,
  AlertTriangle,
  PackageCheck,
  CreditCard,
  Save,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import BookingPortal from "@/components/BookingPortal";
import type { ServicePackage } from "@/types/packages";
import { getPaymentLink } from "@/lib/clover-payment-links";

const APP_ID = "kent";

/* ─── License Progress Steps ─── */
const licenseSteps = [
  { key: "permit", label: "Get Your Learner Permit", icon: FileText },
  { key: "course", label: "Complete Driver Education Course", icon: BookOpen },
  { key: "practice", label: "Log Practice Driving Hours", icon: Car },
  { key: "knowledge", label: "Pass Knowledge Test", icon: CheckCircle2 },
  { key: "driving", label: "Pass Driving Skills Test", icon: Car },
  { key: "license", label: "Receive Your Driver License", icon: CheckCircle2 },
];

/* ─── Quick Book Packages (mock) ─── */
const quickBookOptions: ServicePackage[] = [
  {
    id: "quick-practice",
    name: "Practice Drive Session",
    price: 80,
    hours: 1,
    requiredDrives: 1,
    category: "Adult-Packages",
    subtitle: "1-Lesson with Professional Instructor",
    features: [{ text: "1 Hour Behind-the-Wheel", included: true }],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "quick-knowledge",
    name: "Knowledge Test",
    price: 25,
    hours: 0,
    requiredDrives: 0,
    category: "Knowledge-Test-Options",
    subtitle: "Official DOL Knowledge Exam",
    features: [{ text: "Official WA DOL Exam", included: true }],
    isPopular: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "quick-driving",
    name: "Driving Test",
    price: 70,
    hours: 0,
    requiredDrives: 0,
    category: "Driving-Test-Options",
    subtitle: "Official DOL Skills Exam",
    features: [{ text: "Official WA DOL Skills Test", included: true }],
    isPopular: false,
    isActive: true,
    sortOrder: 3,
  },
];

/* ─── Profile Edit Modal ─── */
function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: Record<string, string>;
  onSave: (data: Record<string, string>) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
      setPhoneNumber(profile.phoneNumber ?? "");
      setSaved(false);
    }
  }, [isOpen, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ firstName, lastName, phoneNumber });
    setSaving(false);
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-forest-700">
                Edit Your Profile
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-stone-100 rounded-full"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-forest-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-forest-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(206) 555-1234"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-forest-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email ?? ""}
                  disabled
                  className="w-full px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-400 cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : saved ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Record<string, any>>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [bookingPkg, setBookingPkg] = useState<ServicePackage | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dynamicPaymentLinks, setDynamicPaymentLinks] = useState<
    Record<string, string>
  >({});
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reportingPayment, setReportingPayment] = useState(false);

  // Load dynamic payment links from packages
  useEffect(() => {
    async function fetchDynamicLinks() {
      const categories = [
        "Adult-Packages",
        "Teen-Packages",
        "Knowledge-Test-Options",
        "Driving-Test-Options",
      ];
      const linksMap: Record<string, string> = {};

      await Promise.all(
        categories.map(async (cat) => {
          try {
            const snap = await getDocs(
              collection(
                db,
                `artifacts/${APP_ID}/public/data/packages/${cat}/list`
              )
            );
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.paymentLink) {
                if (data.name)
                  linksMap[data.name.toLowerCase()] = data.paymentLink;
                linksMap[docSnap.id.toLowerCase()] = data.paymentLink;
              }
            });
          } catch (err) {
            /* ignore read errors if unauthenticated momentarily */
          }
        })
      );
      setDynamicPaymentLinks(linksMap);
    }
    fetchDynamicLinks();
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Fetch student profile
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, `artifacts/${APP_ID}/public/data/students/${user.uid}`),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile({
            email: user.email,
            firstName: user.displayName?.split(" ")[0] ?? "",
            lastName: user.displayName?.split(" ").slice(1).join(" ") ?? "",
            paymentStatus: "none",
          });
        }
        setProfileLoading(false);
      },
      (err) => {
        console.warn("Profile read denied:", err);
        // Fallback state if disconnected
        setProfile({
          email: user.email,
          paymentStatus: "none",
        });
        setProfileLoading(false);
      }
    );
    return unsub;
  }, [user]);

  // Real-time appointments listener
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, `artifacts/${APP_ID}/public/data/appointments`);
    const q = query(
      ref,
      where("userId", "==", user.uid),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => setAppointments([])
    );
    return unsub;
  }, [user]);

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Cancel this appointment?")) return;
    setCancelling(appointmentId);
    try {
      const functions = getFunctions();
      const cancelFn = httpsCallable(functions, "cancelAppointment");
      await cancelFn({ appointmentId });
    } catch (err) {
      /* handled by onSnapshot update */
    }
    setCancelling(null);
  };

  const handleReportPayment = async () => {
    if (!profile.enrolledPackage) {
      alert("Please select a package first before reporting a payment.");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to report this payment as completed? We will review it shortly."
      )
    )
      return;
    setReportingPayment(true);
    try {
      if (!user) throw new Error("No user");
      const functions = getFunctions();
      const reportFn = httpsCallable(functions, "reportPaymentStatus");
      await reportFn({});
      // Profile will update via onSnapshot listener automatically
      alert("✅ Payment status reported. Our team will verify it.");
    } catch (err) {
      alert(
        "There was an error communicating with the server. Please email support."
      );
    }
    setReportingPayment(false);
  };

  const handleProfileSave = async (data: Record<string, string>) => {
    if (!user) return;
    const ref = doc(db, `artifacts/${APP_ID}/public/data/students`, user.uid);
    await setDoc(
      ref,
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    setProfile((prev) => ({ ...prev, ...data }));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-forest-700/20 border-t-forest-700 rounded-full animate-spin" />
      </div>
    );
  }

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    user.displayName ||
    "Student";

  const isPaymentPending = profile.paymentStatus !== "completed";
  const hasEnrolledPackage = !!profile.enrolledPackage;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-blue-50/30 to-stone-50 pt-24 pb-16 px-4 sm:px-6 relative">
        {/* PAYMENT SOFT BANNER */}
        <AnimatePresence>
          {!profileLoading && isPaymentPending && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="max-w-7xl mx-auto mb-6"
            >
              <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gold-800 text-sm">
                      Action Required: Complete Your Enrollment
                    </h3>
                    <p className="text-gold-700 text-xs mt-1 leading-relaxed">
                      Your account is created, but your payment is pending.
                      Please complete your payment via Clover to avoid any
                      booking restrictions.
                      {profile.paymentStatus === "pending" && (
                        <span className="font-bold block mt-1">
                          Our team is manually reviewing a reported payment.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  {hasEnrolledPackage && (
                    <button
                      onClick={handleReportPayment}
                      disabled={
                        reportingPayment ||
                        profile.paymentStatus === "pending" ||
                        profile.paymentStatus === "pending_verification"
                      }
                      className="px-4 py-2 bg-white hover:bg-stone-50 border border-gold-200 text-gold-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {profile.paymentStatus === "pending" ||
                      profile.paymentStatus === "pending_verification"
                        ? "Review Pending"
                        : "I Already Paid"}
                    </button>
                  )}
                  {hasEnrolledPackage && (
                    <button
                      onClick={() => {
                        const pkgIdOrName =
                          typeof profile.enrolledPackage === "string"
                            ? profile.enrolledPackage
                            : profile.enrolledPackage?.id ||
                              profile.enrolledPackage?.name ||
                              "";

                        // Store enrollment data in sessionStorage before redirect
                        sessionStorage.setItem(
                          "pendingEnrollment",
                          JSON.stringify({
                            packageId:
                              typeof profile.enrolledPackage === "string"
                                ? profile.enrolledPackage
                                : profile.enrolledPackage?.id || pkgIdOrName,
                            packageName:
                              typeof profile.enrolledPackage === "string"
                                ? profile.enrolledPackage
                                : profile.enrolledPackage?.name || pkgIdOrName,
                            packagePrice:
                              typeof profile.enrolledPackage === "object"
                                ? profile.enrolledPackage?.price || 0
                                : 0,
                            timestamp: new Date().toISOString(),
                          })
                        );

                        const dynamicLink = pkgIdOrName
                          ? dynamicPaymentLinks[pkgIdOrName.toLowerCase()]
                          : null;
                        const finalLink =
                          dynamicLink || getPaymentLink(pkgIdOrName);
                        window.open(finalLink, "_self"); // Clover redirects within the same tab, so use _self
                      }}
                      className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-gold-500/20"
                    >
                      {" "}
                      Complete Payment
                    </button>
                  )}
                  {!hasEnrolledPackage && (
                    <button
                      onClick={() => router.push("/services")}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      Browse Packages
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto transition-all duration-500">
          {/* ── Welcome Header ── */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-forest-700">
              Welcome, {displayName}!
            </h1>
            <p className="mt-2 text-base text-stone-500">
              Here&apos;s an overview of your account and upcoming appointments.
            </p>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* ── Left Column ── */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Appointments */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6"
              >
                <h2 className="text-lg font-bold text-forest-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Your Upcoming Appointments
                </h2>
                {appointments.length === 0 ? (
                  <div className="border border-dashed border-stone-200 rounded-xl p-8 text-center">
                    <Clock className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-400 font-semibold text-sm">
                      You have no upcoming appointments.
                    </p>
                    <p className="text-stone-400 text-xs mt-1">
                      Book a session below to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-forest-700 text-sm">
                              {apt.sessionType}
                            </p>
                            <p className="text-stone-500 text-xs">
                              {apt.date} at {apt.time}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancelling === apt.id}
                          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {cancelling === apt.id ? "..." : "Cancel"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* Quick Book */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6"
              >
                <h2 className="text-lg font-bold text-forest-700 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold-500" />
                  Book a New Session
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {quickBookOptions.map((opt) => {
                    let isLocked = false;
                    let unlockDateStr = "";

                    if (
                      opt.id === "quick-practice" &&
                      profile.enrolledPackage?.teenSession?.startDate
                    ) {
                      const startDate = new Date(
                        profile.enrolledPackage.teenSession.startDate +
                          "T00:00:00"
                      );
                      const unlockDate = new Date(startDate);
                      unlockDate.setDate(unlockDate.getDate() + 14);

                      if (new Date() < unlockDate) {
                        isLocked = true;
                        unlockDateStr = unlockDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }
                    }

                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={isLocked ? {} : { scale: 1.02 }}
                        whileTap={isLocked ? {} : { scale: 0.97 }}
                        onClick={() => !isLocked && setBookingPkg(opt)}
                        className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex-col 2xl:flex-row ${
                          isLocked
                            ? "bg-stone-50 text-stone-400 cursor-not-allowed border border-stone-200"
                            : "bg-forest-700 hover:bg-forest-600 text-white"
                        }`}
                        title={
                          isLocked
                            ? `State law requires 14 days of classes first. Unlocks on ${unlockDateStr}`
                            : ""
                        }
                      >
                        {isLocked ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-4 h-4 text-stone-400" />
                              <span>{opt.name}</span>
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-stone-500 bg-white px-2.5 py-[2px] rounded-full border border-stone-200 mt-0.5 shadow-sm">
                              Unlocks {unlockDateStr}
                            </span>
                          </div>
                        ) : (
                          <>
                            {opt.id.includes("practice") && (
                              <Car className="w-4 h-4" />
                            )}
                            {opt.id.includes("knowledge") && (
                              <FileText className="w-4 h-4" />
                            )}
                            {opt.id.includes("driving") && (
                              <Car className="w-4 h-4" />
                            )}
                            <span>{opt.name}</span>
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>
            </div>

            {/* ── Right Column ── */}
            <aside className="space-y-6">
              {/* Profile Card */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6"
              >
                {profileLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-forest-700 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-forest-700">{displayName}</p>
                        <p className="text-xs text-stone-400">Student</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Mail className="w-4 h-4 text-stone-400" />
                        <span className="truncate">
                          {profile.email || user.email}
                        </span>
                      </div>
                      {profile.phoneNumber && (
                        <div className="flex items-center gap-2 text-stone-600">
                          <Phone className="w-4 h-4 text-stone-400" />
                          {profile.phoneNumber}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setEditOpen(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-forest-700 font-bold py-2.5 rounded-xl transition-colors text-sm"
                      id="edit-profile-btn"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </>
                )}
              </motion.section>

              {/* Enrolled Package */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6"
              >
                <h3 className="text-sm font-bold text-forest-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Enrolled Package
                </h3>
                {profile.enrolledPackage ? (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="font-bold text-forest-700">
                      {typeof profile.enrolledPackage === "string"
                        ? profile.enrolledPackage
                        : profile.enrolledPackage?.name ||
                          profile.enrolledPackage?.packageName ||
                          "Enrolled"}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-stone-400 text-xs font-semibold">
                      No package enrolled yet.
                    </p>
                    <button
                      onClick={() => router.push("/services")}
                      className="mt-2 text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mx-auto"
                    >
                      Browse Packages <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.section>

              {/* License Progress */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6"
              >
                <h3 className="text-sm font-bold text-forest-700 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Steps to Your License
                </h3>
                <div className="space-y-3">
                  {licenseSteps.map((step) => {
                    const StepIcon = step.icon;

                    let isComplete = false;
                    if (step.key === "permit" && profile.permitNumber)
                      isComplete = true;
                    if (
                      step.key === "course" &&
                      profile.courseCompleted === true
                    )
                      isComplete = true;
                    if (
                      step.key === "practice" &&
                      appointments.some(
                        (a) =>
                          a.serviceId?.includes("practice") &&
                          a.status === "completed"
                      )
                    )
                      isComplete = true;
                    if (
                      step.key === "knowledge" &&
                      appointments.some(
                        (a) =>
                          a.serviceId?.includes("knowledge") &&
                          a.status === "completed"
                      )
                    )
                      isComplete = true;
                    if (
                      step.key === "driving" &&
                      appointments.some(
                        (a) =>
                          a.serviceId?.includes("driving") &&
                          a.status === "completed"
                      )
                    )
                      isComplete = true;
                    if (
                      step.key === "license" &&
                      profile.licenseIssued === true
                    )
                      isComplete = true;

                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 text-sm py-1.5 ${
                          isComplete ? "text-emerald-600" : "text-stone-400"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 shrink-0" />
                        )}
                        <span
                          className={`font-semibold ${
                            isComplete ? "line-through opacity-60" : ""
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            </aside>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={handleProfileSave}
      />
      <BookingPortal
        isOpen={!!bookingPkg}
        onClose={() => setBookingPkg(null)}
        selectedPackage={bookingPkg}
      />
    </>
  );
}
