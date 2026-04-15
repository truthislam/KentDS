"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  CreditCard,
  CalendarPlus,
  Clock,
  Settings,
  FileEdit,
  LogOut,
  Menu,
  X,
  Loader2,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Package,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const APP_ID = "kent";
const SITE_CONTENT_BASE = `artifacts/${APP_ID}/public/data/siteContent`;

/* ─── Tab Config ─── */
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "students", label: "Students", icon: Users },
  { id: "sessions", label: "Teen Sessions", icon: BookOpen },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "schedule", label: "Schedule", icon: CalendarPlus },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "cms", label: "Homepage CMS", icon: FileEdit },
  { id: "packages", label: "Packages", icon: Package },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ═══════════════════════════════════════════════
   INDIVIDUAL TAB PANELS
   ═══════════════════════════════════════════════ */

/* ── Dashboard Overview ── */
function DashboardTab() {
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    unassigned: 0,
    availableSlots: 0,
    totalStudents: 0,
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [abandonedStudents, setAbandonedStudents] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const studentsRef = collection(db, `artifacts/${APP_ID}/public/data/students`);
        const qStudents = query(studentsRef, orderBy("createdAt", "desc"), limit(50));
        const unsubStudents = onSnapshot(qStudents, (snap) => {
          const docs: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          const abandoned = docs.filter(s => {
            if (s.paymentStatus !== "pending") return false;
            if (!s.createdAt) return false;
            const createdTime = s.createdAt?.toMillis ? s.createdAt.toMillis() : new Date(s.createdAt).getTime();
            if (isNaN(createdTime)) return false;
            return (Date.now() - createdTime) > 7 * 60 * 1000;
          });
          setAbandonedStudents(abandoned);

          setRecentActivities(docs.slice(0, 5));
        });
        
        const snap = await getDocs(studentsRef);
        setStats((s) => ({ ...s, totalStudents: snap.size }));
        return unsubStudents;
      } catch (err) {
        console.warn("loadStats read denied or failed:", err);
      }
    }
    const unsubStudentsP = loadStats();
    
    const apptsRef = collection(db, `artifacts/${APP_ID}/public/data/appointments`);
    const q = query(apptsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      
      let todayCount = 0;
      let unassignedCount = 0;
      const todayStr = new Date().toISOString().split("T")[0];
      
      const newEvents = docs.map(d => {
        if (d.date === todayStr) todayCount++;
        if (!d.instructorId) unassignedCount++;
        
        let color = "#3b82f6"; // blue (adult or generic)
        const typeStr = d.sessionType?.toLowerCase() || "";
        
        if (typeStr.includes("test")) {
          color = "#8b5cf6"; // purple for testing packages (knowledge/driving test)
        } else if (typeStr.includes("teen")) {
          color = "#10b981"; // green for teens
        }
        
        return {
          title: `${d.studentName ?? "Student"} (${d.sessionType ?? "Unknown"})`,
          date: d.date,
          color
        };
      });
      
      setStats(prev => ({ ...prev, appointmentsToday: todayCount, unassigned: unassignedCount }));
      setEvents(newEvents);
      setLoading(false);
    });
    
    return () => {
      unsub();
      unsubStudentsP.then(u => u && u());
    };
  }, []);

  const metrics = [
    { label: "Appointments Today", value: stats.appointmentsToday, emoji: "📅", color: "from-blue-500 to-blue-700" },
    { label: "Unassigned", value: stats.unassigned, emoji: "👤", color: "from-gold-500 to-gold-700" },
    { label: "Available Slots", value: stats.availableSlots, emoji: "✅", color: "from-emerald-500 to-emerald-700" },
    { label: "Total Students", value: Math.max(stats.totalStudents, recentActivities.length), emoji: "🎓", color: "from-violet-500 to-violet-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-lg shadow-md`}>
                {m.emoji}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{m.label}</span>
            </div>
            <p className="text-3xl font-extrabold text-forest-700">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-stone-300" /> : m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-6 overflow-hidden">
          <h3 className="font-bold text-forest-700 mb-4">Upcoming Appointments Calendar</h3>
          <div className="min-h-[500px]">
            <style>
              {`
                .fc .fc-toolbar-title { font-size: 1.125rem; font-weight: 800; color: #14532d; }
                .fc .fc-button-primary { background-color: #f3f4f6; border-color: #e5e7eb; color: #374151; font-weight: bold; text-transform: capitalize; }
                .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #16a34a; color: white; border-color: #16a34a; }
                .fc-theme-standard td, .fc-theme-standard th { border-color: #f3f4f6; }
                .fc-day-today { background-color: #f0fdf4 !important; }
              `}
            </style>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              headerToolbar={{
                left: 'title',
                right: 'prev,next today'
              }}
              height="auto"
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 overflow-hidden flex flex-col h-full">
          <h3 className="font-bold text-forest-700 mb-4 flex-shrink-0">Latest Activity</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {abandonedStudents.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 font-bold mb-2 text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Potential Students ({abandonedStudents.length})
                </div>
                <div className="space-y-2">
                  {abandonedStudents.slice(0, 3).map(s => (
                    <div key={s.id} className="bg-white border border-rose-100 rounded-lg p-2 text-xs flex justify-between items-center">
                      <span className="font-bold text-forest-800">{s.firstName} {s.lastName}</span>
                      <span className="text-stone-500">Left at payment</span>
                    </div>
                  ))}
                  {abandonedStudents.length > 3 && (
                    <div className="text-center text-xs text-rose-600 font-bold mt-1">
                      + {abandonedStudents.length - 3} more in Students tab
                    </div>
                  )}
                </div>
              </div>
            )}

            {recentActivities.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Recent Signups</div>
                {recentActivities.map(s => (
                  <div key={s.id} className="bg-stone-50 border border-stone-100 rounded-lg p-3 text-sm flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-forest-800">{s.firstName} {s.lastName}</span>
                      <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${s.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gold-100 text-gold-700'}`}>
                        {s.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 truncate">{typeof s.enrolledPackage === 'string' ? s.enrolledPackage : s.enrolledPackage?.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
                No recent signups.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Students Tab ── */
function StudentsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, `artifacts/${APP_ID}/public/data/students`);
    const unsub = onSnapshot(ref, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.firstName?.toLowerCase().includes(q) ?? false) ||
      (s.lastName?.toLowerCase().includes(q) ?? false) ||
      (s.email?.toLowerCase().includes(q) ?? false)
    );
  });

  const abandonedStudents = students.filter(s => {
    if (s.paymentStatus !== "pending") return false;
    if (!s.createdAt) return false;
    // Handle Firebase Timestamp or fallback
    const createdTime = s.createdAt?.toMillis ? s.createdAt.toMillis() : new Date(s.createdAt).getTime();
    if (isNaN(createdTime)) return false;
    return (Date.now() - createdTime) > 7 * 60 * 1000;
  });

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete student ${name}? This action cannot be undone.`)) return;
    try {
      const functions = getFunctions();
      const delFn = httpsCallable(functions, "deleteStudentAccount");
      await delFn({ studentId: id });
    } catch (err: any) {
      alert("Failed to delete student: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {abandonedStudents.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-2 text-rose-700 font-bold mb-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Potential Students (Abandoned Checkout &gt; 7 mins)
          </div>
          
          <div className="mb-4 bg-white/60 rounded-xl p-3 border border-rose-100 text-xs text-rose-800/80 leading-relaxed">
            <strong>System Tip:</strong> These are visitors who completed Step 1 (Account Creation) but left the website before finishing their payment on Clover. Their information is automatically captured here after a 10-minute delay. <strong>Action Required:</strong> Call or email these students to help them complete their enrollment!
          </div>

          <div className="space-y-2">
            {abandonedStudents.map(s => (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-rose-100 rounded-xl p-3 shadow-sm">
                <div>
                  <p className="font-bold text-forest-800 text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3" /> {s.email}
                    {s.phoneNumber && <><Phone className="w-3 h-3 ml-2" /> {s.phoneNumber}</>}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                  <p className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 px-2 py-1 rounded-md inline-block">
                    {typeof s.enrolledPackage === 'string' ? s.enrolledPackage : s.enrolledPackage?.name || "Unknown Package"}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">Follow up immediately</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <span className="text-xs text-stone-400 font-bold">{filtered.length} students</span>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="w-8 px-2 py-3"></th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Email</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Phone</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Package</th>
                <th className="text-right px-4 py-3 font-bold text-stone-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400 font-semibold">No students found.</td></tr>
              ) : (
                filtered.map((s) => {
                  const isExpanded = expandedId === s.id;
                  const addr = s.address;
                  const createdDate = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                  return (
                    <>
                      <tr key={s.id} className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                        <td className="px-2 py-3 text-center">
                          <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </td>
                        <td className="px-4 py-3 font-bold text-forest-700">{s.firstName ?? ""} {s.lastName ?? ""}</td>
                        <td className="px-4 py-3 text-stone-600">{s.email ?? "—"}</td>
                        <td className="px-4 py-3 text-stone-600">{s.phoneNumber ?? "—"}</td>
                        <td className="px-4 py-3 text-stone-600 text-xs font-bold text-blue-600">
                          {typeof s.enrolledPackage === 'string' ? s.enrolledPackage : s.enrolledPackage?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDeleteStudent(s.id, (s.firstName ?? "") + " " + (s.lastName ?? ""))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Student"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={s.id + "-detail"} className="bg-stone-50/70">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white rounded-xl border border-stone-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Address</span>
                                </div>
                                {addr ? (
                                  <p className="text-sm text-stone-700 font-medium">
                                    {addr.street || "—"}<br />
                                    {addr.city || ""}{addr.city && addr.zip ? ", " : ""}{addr.zip || ""}
                                  </p>
                                ) : <p className="text-sm text-stone-400">Not provided</p>}
                              </div>
                              <div className="bg-white rounded-xl border border-stone-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Contact</span>
                                </div>
                                <p className="text-sm text-stone-700 font-medium truncate">{s.email || "—"}</p>
                                <p className="text-sm text-stone-700 font-medium">{s.phoneNumber || "—"}</p>
                              </div>
                              <div className="bg-white rounded-xl border border-stone-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Payment</span>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-wider ${
                                  s.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  s.paymentStatus === 'pending_verification' ? 'bg-violet-100 text-violet-700' :
                                  s.paymentStatus === 'pending' ? 'bg-gold-100 text-gold-700' :
                                  'bg-stone-100 text-stone-500'
                                }`}>
                                  {s.paymentStatus === 'completed' ? 'Paid' : s.paymentStatus === 'pending_verification' ? 'Verifying' : s.paymentStatus === 'pending' ? 'Pending' : s.paymentStatus || 'None'}
                                </span>
                              </div>
                              <div className="bg-white rounded-xl border border-stone-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Enrolled</span>
                                </div>
                                <p className="text-sm text-stone-700 font-medium">{createdDate}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Appointments Tab ── */
function AppointmentsTab() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [instName, setInstName] = useState("");
  const [instEmail, setInstEmail] = useState("");

  useEffect(() => {
    const ref = collection(db, `artifacts/${APP_ID}/public/data/appointments`);
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  useEffect(() => {
    const ref = collection(db, `artifacts/${APP_ID}/public/data/instructors`);
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName || !instEmail) return;
    try {
      await addDoc(collection(db, `artifacts/${APP_ID}/public/data/instructors`), {
        name: instName.trim(),
        email: instEmail.trim(),
        createdAt: serverTimestamp()
      });
      setInstName("");
      setInstEmail("");
    } catch (err) { alert("Failed to add instructor"); }
  };

  const handleDeleteInst = async (id: string) => {
    if (!confirm("Remove instructor?")) return;
    await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/instructors`, id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-4">Appointments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input placeholder="Student name or email" className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Instructors</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input type="date" className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Student</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Date/Time</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Instructor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-stone-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-stone-400 font-semibold">No appointments yet.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-forest-700">{a.studentName ?? "Student"}</td>
                    <td className="px-4 py-3 text-stone-600">{a.date} at {a.time}</td>
                    <td className="px-4 py-3 text-stone-600">{a.sessionType ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-600">{a.instructorId ?? "Unassigned"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h3 className="font-bold text-forest-700 mb-4">Instructors</h3>
          <form onSubmit={handleAddInstructor} className="space-y-3 mb-6">
            <input value={instName} onChange={e=>setInstName(e.target.value)} placeholder="Instructor Name" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" value={instEmail} onChange={e=>setInstEmail(e.target.value)} placeholder="Instructor Email" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all text-sm">Add Instructor</button>
          </form>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {instructors.map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-forest-700">{i.name}</p>
                  <p className="text-[10px] text-stone-500">{i.email}</p>
                </div>
                <button onClick={() => handleDeleteInst(i.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {instructors.length === 0 && <p className="text-xs text-stone-400 text-center py-4">No instructors added.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Tracking Tab ── */
function PaymentTrackingTab() {
  const [filter, setFilter] = useState("all");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = [
    { id: "all", label: "All Students" },
    { id: "completed", label: "✅ Paid" },
    { id: "pending_verification", label: "🔍 Verifying" },
    { id: "pending", label: "⚠️ Pending" },
    { id: "inReview", label: "📋 In Review" },
    { id: "none", label: "❌ No Payment" },
  ];

  useEffect(() => {
    const ref = collection(db, `artifacts/${APP_ID}/public/data/students`);
    const unsub = onSnapshot(ref, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/students`, id), {
        paymentStatus: newStatus
      });
      if (newStatus === "completed") {
        const pendingRef = collection(db, `artifacts/${APP_ID}/public/data/pendingTestNotifications`);
        const q = query(pendingRef, where("userId", "==", id), where("paymentConfirmed", "==", false), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const pendingDoc = snap.docs[0];
          const functions = getFunctions();
          const confirmFn = httpsCallable(functions, "confirmTestPayment");
          await confirmFn({ appointmentId: pendingDoc.id, packageId: "admin_override", packageName: "Admin Override" });
        }
      }
    } catch (err: any) { alert("Failed to update status: " + err.message); }
  };

  const filtered = students.filter(s => {
    if (filter === "all") return true;
    if (filter === "none") return !s.paymentStatus || s.paymentStatus === "none";
    return s.paymentStatus === filter;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? "bg-forest-700 text-white shadow-md"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Email</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Package</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Status</th>
                <th className="text-right px-4 py-3 font-bold text-stone-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-stone-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-stone-400 font-semibold">No payment records found.</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-forest-700">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 text-stone-600">{s.email}</td>
                    <td className="px-4 py-3 text-stone-600 font-bold text-blue-600">{s.enrolledPackage?.name || s.enrolledPackage?.packageName || (typeof s.enrolledPackage === "string" ? s.enrolledPackage : "—")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1.5 rounded-md text-[10px] uppercase font-black tracking-wider ${
                        s.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        s.paymentStatus === 'pending_verification' ? 'bg-violet-100 text-violet-700' :
                        s.paymentStatus === 'pending' ? 'bg-gold-100 text-gold-700' : 
                        s.paymentStatus === 'inReview' ? 'bg-blue-100 text-blue-700' : 
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {s.paymentStatus === 'completed' ? 'Paid' : s.paymentStatus === 'pending_verification' ? 'Verifying' : s.paymentStatus === 'pending' ? 'Pending' : s.paymentStatus === 'inReview' ? 'In Review' : 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select 
                        value={s.paymentStatus || "none"}
                        onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                        className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">No Payment</option>
                        <option value="pending">Mark Pending</option>
                        <option value="pending_verification">Verifying (Clover)</option>
                        <option value="inReview">Under Review</option>
                        <option value="completed">Mark Paid ✅</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Teen Sessions Tab ── */
function SessionsTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"Weekday" | "Weekend">("Weekday");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [capacity, setCapacity] = useState(25);
  const [saving, setSaving] = useState(false);

  // Batch Generation State
  const [batchType, setBatchType] = useState<"Weekday" | "Weekend">("Weekday");
  const [batchCount, setBatchCount] = useState(6);
  const [preview, setPreview] = useState<any[]>([]);
  const [batching, setBatching] = useState(false);

  useEffect(() => {
    const ref = collection(db, `artifacts/${APP_ID}/public/data/teen_sessions`);
    const unsub = onSnapshot(ref, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (a.startDate || "").localeCompare(b.startDate || ""));
      setSessions(docs);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const getDefaults = (t: "Weekday" | "Weekend") => {
    if (t === "Weekday") return { days: ["Mon", "Tue", "Wed"], timeStart: "5:00 PM", timeEnd: "7:00 PM", capacity: 25 };
    return { days: ["Sat", "Sun"], timeStart: "4:00 PM", timeEnd: "6:00 PM", capacity: 20 };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;
    setSaving(true);
    const defaults = getDefaults(type);
    try {
      await addDoc(collection(db, `artifacts/${APP_ID}/public/data/teen_sessions`), {
        type,
        startDate: start,
        endDate: end,
        days: defaults.days,
        timeStart: defaults.timeStart,
        timeEnd: defaults.timeEnd,
        totalHours: 30,
        capacity: capacity,
        enrolled: 0,
        isActive: true,
        scheduleDisplay: `${defaults.timeStart.replace(":00", "").replace(" PM", " pm").replace(" AM", " am")} - ${defaults.timeEnd.replace(":00", "").replace(" PM", " pm").replace(" AM", " am")} ${defaults.days.join(", ")}`,
        createdAt: serverTimestamp(),
      });
      setStart("");
      setEnd("");
    } catch (err) { alert("Failed to add session"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete session?")) return;
    await deleteDoc(doc(db, `artifacts/${APP_ID}/public/data/teen_sessions`, id));
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/teen_sessions`, id), {
      isActive: !currentActive,
    });
  };

  const generatePreview = () => {
    if (batchCount < 1) return;
    const { generateSessions } = require("@/lib/teen-sessions");
    const items = generateSessions(batchType, batchCount);
    setPreview(items);
  };

  const handleConfirmBatch = async () => {
    setBatching(true);
    try {
      const colRef = collection(db, `artifacts/${APP_ID}/public/data/teen_sessions`);
      for (const p of preview) {
        await addDoc(colRef, {
          ...p,
          createdAt: serverTimestamp(),
        });
      }
      setPreview([]);
      setBatchCount(6);
    } catch (err) { alert("Failed to batch create"); }
    setBatching(false);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-4">Teen Course Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Dates</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Schedule</th>
                <th className="text-left px-4 py-3 font-bold text-stone-500 text-xs uppercase">Enrolled</th>
                <th className="text-right px-4 py-3 font-bold text-stone-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-stone-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-stone-400 font-semibold">No sessions — use the batch generator to create.</td></tr>
              ) : (
                sessions.map((s: any) => (
                  <tr key={s.id} className={`hover:bg-blue-50/40 transition-colors ${s.isActive === false ? "opacity-40" : ""}`}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-wider ${s.type === "Weekday" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{s.type}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs font-medium">{formatDate(s.startDate)} – {formatDate(s.endDate)}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{s.scheduleDisplay || `${s.days?.join(", ") || "—"} ${s.timeStart || ""}`}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs font-bold">{s.enrolled ?? 0}/{s.capacity ?? "∞"}</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                      <button onClick={() => handleToggleActive(s.id, s.isActive !== false)} title={s.isActive !== false ? "Deactivate" : "Activate"} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                        {s.isActive !== false ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-stone-400" />}
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h3 className="font-bold text-forest-700 mb-4">Add Single Session</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5">Session Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["Weekday", "Weekend"] as const).map((t) => (
                  <label key={t} className="flex items-center justify-center p-2.5 rounded-xl border-2 border-stone-200 cursor-pointer hover:border-blue-400 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition-all">
                    <input type="radio" name="session-type" checked={type === t} onChange={() => { setType(t); setCapacity(getDefaults(t).capacity); }} value={t} className="sr-only" />
                    <span className="text-sm font-bold">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5">Start Date</label>
                <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5">End Date</label>
                <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5">Max Capacity</label>
              <input type="number" min="1" max="50" value={capacity} onChange={e=>setCapacity(parseInt(e.target.value))} className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Session
            </button>
          </form>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-indigo-900 mb-1">Smart Batch Generator</h3>
          <p className="text-xs text-indigo-700/70 mb-4">Auto-generate rolling sessions based on the school&apos;s schedule rules.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-indigo-800 mb-1.5">Type</label>
              <select value={batchType} onChange={e=>setBatchType(e.target.value as any)} className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Weekday">Weekday (Mon/Tue/Wed, 5-7pm, ~5wks)</option>
                <option value="Weekend">Weekend (Sat/Sun, 4-6pm, ~8wks)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-800 mb-1.5">How many sessions?</label>
              <input type="number" min="1" max="12" value={batchCount} onChange={e=>setBatchCount(parseInt(e.target.value))} className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {preview.length === 0 ? (
               <button onClick={generatePreview} className="w-full bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-600 font-bold py-3 rounded-xl transition-all text-sm">Generate Preview</button>
            ) : (
               <div className="animate-in fade-in slide-in-from-top-2">
                 <h4 className="text-xs font-black text-indigo-500 uppercase mb-2 mt-2">Preview ({preview.length} sessions)</h4>
                 <div className="max-h-40 overflow-y-auto bg-white border border-indigo-100 rounded-xl p-2 space-y-1 mb-3">
                   {preview.map((p: any, i: number) => (
                     <div key={i} className="text-xs font-medium text-stone-600 p-1.5 bg-stone-50 rounded-lg">
                       [{i+1}] {formatDate(p.startDate)} → {formatDate(p.endDate)}
                       <span className="text-stone-400 ml-1">({p.scheduleDisplay})</span>
                     </div>
                   ))}
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => setPreview([])} className="px-4 py-2 bg-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-300">Cancel</button>
                   <button onClick={handleConfirmBatch} disabled={batching} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-1 shadow-md">
                     {batching ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create All ${preview.length} Sessions`}
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Schedule Tab ── */
function ScheduleTab() {
  const [studentType, setStudentType] = useState<"existing" | "external">("existing");
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  
  const [selStudent, setSelStudent] = useState("");
  const [extName, setExtName] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extPhone, setExtPhone] = useState("");
  
  const [apptType, setApptType] = useState("");
  const [instructor, setInstructor] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubS = onSnapshot(collection(db, `artifacts/${APP_ID}/public/data/students`), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubI = onSnapshot(collection(db, `artifacts/${APP_ID}/public/data/instructors`), (snap) => {
      setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubS(); unsubI(); };
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDate || !apptTime || !apptType) return alert("Missing date/time/type");
    
    let studentName = extName;
    let studentEmail = extEmail;
    if (studentType === "existing") {
      if (!selStudent) return alert("Select a student");
      const s = students.find(x => x.id === selStudent);
      if (s) {
        studentName = s.firstName + " " + (s.lastName || "");
        studentEmail = s.email;
      }
    } else {
      if (!extName || !extEmail) return alert("New client needs name & email");
    }

    setSaving(true);
    try {
      const availRef = collection(db, `artifacts/${APP_ID}/public/data/availability`);
      const timeStrParts = apptTime.split(":");
      const hours = parseInt(timeStrParts[0]);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 === 0 ? 12 : hours % 12;
      const formattedTime = `${displayHour}:${timeStrParts[1]} ${ampm}`;

      const q = query(availRef, where("date", "==", apptDate), where("time", "==", formattedTime), limit(1));
      const availSnap = await getDocs(q);
      
      let availabilityId = "";
      if (availSnap.empty) {
        const newSlot = await addDoc(availRef, {
          date: apptDate,
          time: formattedTime,
          isBooked: false,
          createdAt: serverTimestamp(),
          instructorId: instructor || null
        });
        availabilityId = newSlot.id;
      } else {
        availabilityId = availSnap.docs[0].id;
      }

      const functions = getFunctions();
      const bookFn = httpsCallable(functions, "adminBookAppointment");
      await bookFn({
        studentType,
        studentId: studentType === "existing" ? selStudent : undefined,
        externalName: extName,
        externalEmail: extEmail,
        externalPhone: extPhone,
        availabilityId,
        sessionType: apptType,
        instructorId: instructor || null
      });

      alert("✅ Appointment successfully scheduled.");
      setApptDate(""); setApptTime(""); setSelStudent(""); 
      setExtName(""); setExtEmail(""); setExtPhone("");
    } catch (err: any) { alert("Failed to schedule appointment: " + err.message); }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8">
      <h3 className="font-bold text-lg text-forest-700 mb-6">Schedule Appointment</h3>
      <form onSubmit={handleSchedule} className="space-y-6">
        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 space-y-5">
          <label className="block text-sm font-bold text-forest-700">Who are you scheduling for?</label>
          <div className="grid grid-cols-2 gap-3">
            {(["existing", "external"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setStudentType(t)}
                className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  studentType === t
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-stone-200 text-stone-500 hover:border-stone-300"
                }`}
              >
                {t === "existing" ? "Existing Student" : "New/External Client"}
              </button>
            ))}
          </div>

          {studentType === "existing" ? (
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5">Select Student</label>
              <select value={selStudent} onChange={e=>setSelStudent(e.target.value)} required className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.email})</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-3 pt-3 border-t border-dashed border-stone-200">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">New Client Details</h4>
              <input value={extName} onChange={e=>setExtName(e.target.value)} placeholder="Full Name *" className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" value={extEmail} onChange={e=>setExtEmail(e.target.value)} placeholder="Email *" className="px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="tel" value={extPhone} onChange={e=>setExtPhone(e.target.value)} placeholder="Phone" className="px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1.5">Appointment Type</label>
            <select value={apptType} onChange={e=>setApptType(e.target.value)} className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select type…</option>
              <option>Teen Package Session</option>
              <option>Adult Package Session</option>
              <option>Knowledge Test</option>
              <option>Driving Test</option>
              <option>Extra Practice Drive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1.5">Assign Instructor</label>
            <select value={instructor} onChange={e=>setInstructor(e.target.value)} className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Unassigned</option>
              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1.5">Date</label>
            <input type="date" value={apptDate} onChange={e=>setApptDate(e.target.value)} required className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1.5">Time</label>
            <input type="time" value={apptTime} onChange={e=>setApptTime(e.target.value)} required className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Schedule Appointment"}
        </button>
      </form>
    </div>
  );
}

/* ── Availability Tab ── */
function AvailabilityTab() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotDurationMins, setSlotDurationMins] = useState(60);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const addDate = () => {
    if (dateInput && !selectedDates.includes(dateInput)) {
      setSelectedDates(prev => [...prev, dateInput].sort());
    }
    setDateInput("");
  };

  const removeDate = (d: string) => {
    setSelectedDates(prev => prev.filter(x => x !== d));
  };

  const handleGenerate = async () => {
    if (selectedDates.length === 0 || !startTime || !endTime || slotDurationMins <= 0) return;
    setSaving(true);
    setSaved(false);
    
    try {
      const generatedSlots = [];
      const startParts = startTime.split(":").map(Number);
      const endParts = endTime.split(":").map(Number);
      
      const startMins = startParts[0] * 60 + startParts[1];
      const endMins = endParts[0] * 60 + endParts[1];
      
      if (startMins >= endMins) throw new Error("Start must be before End time.");
      
      for (const d of selectedDates) {
        for (let t = startMins; t < endMins; t += slotDurationMins) {
          const hours = Math.floor(t / 60);
          const mins = t % 60;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHour = hours % 12 === 0 ? 12 : hours % 12;
          const displayMins = mins.toString().padStart(2, '0');
          const timeStr = `${displayHour}:${displayMins} ${ampm}`;
          generatedSlots.push({ date: d, time: timeStr });
        }
      }
      
      const batchRef = collection(db, `artifacts/${APP_ID}/public/data/availability`);
      for (const slot of generatedSlots) {
        await addDoc(batchRef, {
          date: slot.date,
          time: slot.time,
          isBooked: false,
          createdAt: serverTimestamp(),
          instructorId: null
        });
      }
      
      setSaved(true);
      setSelectedDates([]);
      setStartTime("");
      setEndTime("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error generating slots. Please check times.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-4">1. Select Dates</h3>
        <div className="flex gap-2 mb-4">
          <input 
            type="date" 
            value={dateInput} 
            onChange={(e) => setDateInput(e.target.value)} 
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <button type="button" onClick={addDate} className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl transition-colors hover:bg-blue-200 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Date
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedDates.length === 0 ? (
            <p className="text-stone-400 text-sm">No dates selected yet.</p>
          ) : (
            selectedDates.map(d => (
              <div key={d} className="flex items-center gap-1 bg-stone-100 px-3 py-1.5 rounded-full text-sm font-semibold text-stone-700">
                {d}
                <button onClick={() => removeDate(d)} className="p-0.5 hover:bg-stone-200 rounded-full text-stone-500"><X className="w-3 h-3" /></button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-4">2. Build Time Slots</h3>
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">Start Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">End Time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1">Duration (Mins)</label>
            <input type="number" min="1" value={slotDurationMins} onChange={(e) => setSlotDurationMins(parseInt(e.target.value) || 60)} className="w-24 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        
        <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
          <p className="text-sm font-bold text-stone-400">
            {selectedDates.length > 0 && startTime && endTime ? "Ready to generate slots." : "Please fill out dates and times."}
          </p>
          <div className="flex items-center gap-3">
            {saved && <span className="text-emerald-600 font-bold text-sm">✅ Slots Published!</span>}
            <button 
              onClick={handleGenerate} 
              disabled={saving || selectedDates.length === 0 || !startTime || !endTime} 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Publish to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Homepage CMS Tab (FULL FIRESTORE WIRING) ── */
function CMSTab() {
  const [activeSubTab, setActiveSubTab] = useState<"homepage" | "services" | "announcements" | "discounts" | "socials">("homepage");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "homepage" as const, label: "🏠 Homepage Text" },
          { id: "services" as const, label: "📦 Services Page" },
          { id: "announcements" as const, label: "📢 Announcements" },
          { id: "discounts" as const, label: "🎟️ Discounts" },
          { id: "socials" as const, label: "🔗 Social Links" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === t.id
                ? "bg-forest-700 text-white shadow-md"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === "homepage" && (
        <div className="space-y-6">
          <HomepageEditor />
          <ProgramsHeaderEditor />
        </div>
      )}
      {activeSubTab === "services" && <ServicesPageEditor />}
      {activeSubTab === "announcements" && <AnnouncementsEditor />}
      {activeSubTab === "discounts" && <DiscountsEditor />}
      {activeSubTab === "socials" && <SocialLinksEditor />}
    </div>
  );
}

function HomepageEditor() {
  const [heroHeading, setHeroHeading] = useState("");
  const [heroHeadingColor, setHeroHeadingColor] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [heroSubheadingColor, setHeroSubheadingColor] = useState("");
  const [ctaPrimary, setCtaPrimary] = useState("");
  const [ctaSecondary, setCtaSecondary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, SITE_CONTENT_BASE, "homepage");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setHeroHeading(d.heroHeading ?? "");
          setHeroHeadingColor(d.heroHeadingColor ?? "");
          setHeroSubheading(d.heroSubheading ?? "");
          setHeroSubheadingColor(d.heroSubheadingColor ?? "");
          setCtaPrimary(d.ctaPrimary ?? "");
          setCtaSecondary(d.ctaSecondary ?? "");
        }
      } catch (err) {
        console.warn("Homepage read denied or failed:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const ref = doc(db, SITE_CONTENT_BASE, "homepage");
      await setDoc(ref, {
        heroHeading,
        heroHeadingColor,
        heroSubheading,
        heroSubheadingColor,
        ctaPrimary,
        ctaSecondary,
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuth.currentUser?.uid,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save homepage config: " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-bold text-forest-700 mb-1">Hero Section</h3>
      <p className="text-sm text-stone-500 mb-6">Edit the main heading, subtitle, and CTA on the homepage</p>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Hero Heading</label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400">Font Color:</label>
              <input type="color" value={heroHeadingColor} onChange={(e) => setHeroHeadingColor(e.target.value)} className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0" title="Heading Color" />
              <button type="button" onClick={() => setHeroHeadingColor("")} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 hover:bg-stone-200">Reset</button>
            </div>
          </div>
          <input value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Become a Confident Driver in Kent" style={{ color: heroHeadingColor || undefined }} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Hero Subtitle</label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400">Font Color:</label>
              <input type="color" value={heroSubheadingColor} onChange={(e) => setHeroSubheadingColor(e.target.value)} className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0" title="Subtitle Color" />
              <button type="button" onClick={() => setHeroSubheadingColor("")} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 hover:bg-stone-200">Reset</button>
            </div>
          </div>
          <textarea value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} rows={2} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="e.g. Your journey to safe, skilled driving starts here." style={{ color: heroSubheadingColor || undefined, fontWeight: heroSubheadingColor ? 'bold' : undefined }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Primary CTA</label>
            <input value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Enroll Now" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Secondary CTA</label>
            <input value={ctaSecondary} onChange={(e) => setCtaSecondary(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. View Packages" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {saved && <span className="text-sm font-bold text-emerald-600">✅ Saved successfully!</span>}
          {!saved && <span />}
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function ServicesPageEditor() {
  const [heading, setHeading] = useState("");
  const [headingColor, setHeadingColor] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [subtitleColor, setSubtitleColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, SITE_CONTENT_BASE, "servicesPage");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setHeading(d.servicesHeading ?? "");
          setHeadingColor(d.servicesHeadingColor ?? "");
          setSubtitle(d.servicesSubtitle ?? "");
          setSubtitleColor(d.servicesSubtitleColor ?? "");
        }
      } catch (err) {
        console.warn("Services page CMS read failed:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const ref = doc(db, SITE_CONTENT_BASE, "servicesPage");
      await setDoc(ref, {
        servicesHeading: heading,
        servicesHeadingColor: headingColor,
        servicesSubtitle: subtitle,
        servicesSubtitleColor: subtitleColor,
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuth.currentUser?.uid,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save services page config: " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-bold text-forest-700 mb-1">Services Page Hero</h3>
      <p className="text-sm text-stone-500 mb-2">Edit the heading and subtitle on the Services/Packages page.</p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-xs text-blue-700 leading-relaxed">
        <strong>Note:</strong> Announcements from the Homepage CMS are automatically displayed on the Services page as well. You only need to edit the heading and subtitle here.
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Page Heading</label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400">Font Color:</label>
              <input type="color" value={headingColor} onChange={(e) => setHeadingColor(e.target.value)} className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0" title="Heading Color" />
              <button type="button" onClick={() => setHeadingColor("")} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 hover:bg-stone-200">Reset</button>
            </div>
          </div>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Premium Driving Programs" style={{ color: headingColor || undefined }} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Page Subtitle</label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400">Font Color:</label>
              <input type="color" value={subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0" title="Subtitle Color" />
              <button type="button" onClick={() => setSubtitleColor("")} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 hover:bg-stone-200">Reset</button>
            </div>
          </div>
          <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={3} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="e.g. Expert instructors, flexible schedules..." style={{ color: subtitleColor || undefined, fontWeight: subtitleColor ? 'bold' : undefined }} />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {saved && <span className="text-sm font-bold text-emerald-600">✅ Saved successfully!</span>}
          {!saved && <span />}
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function ProgramsHeaderEditor() {
  const [headline, setHeadline] = useState("");
  const [headlineColor, setHeadlineColor] = useState("");
  const [subtext, setSubtext] = useState("");
  const [subtextColor, setSubtextColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, SITE_CONTENT_BASE, "programsHeader");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setHeadline(d.headline ?? "");
          setHeadlineColor(d.headlineColor ?? "");
          setSubtext(d.subtext ?? "");
          setSubtextColor(d.subtextColor ?? "");
        }
      } catch (err) {
        console.warn("Programs header read denied or failed:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const ref = doc(db, SITE_CONTENT_BASE, "programsHeader");
      await setDoc(ref, {
        headline,
        headlineColor,
        subtext,
        subtextColor,
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuth.currentUser?.uid,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save programs header: " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8 mt-6">
      <h3 className="text-lg font-bold text-forest-700 mb-1">Driving Programs Header</h3>
      <p className="text-sm text-stone-500 mb-6">Edit the persuasive text sitting directly above your service packages.</p>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Persuasive Headline</label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400">Color Override:</label>
              <input type="color" value={headlineColor} onChange={(e) => setHeadlineColor(e.target.value)} className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0" title="Headline Color" />
              <button type="button" onClick={() => setHeadlineColor("")} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 hover:bg-stone-200">Reset</button>
            </div>
          </div>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Your License, Your Terms — Open 7 Days a Week" style={{ color: headlineColor || undefined }} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Persuasive Subtext</label>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-400">Color Override:</label>
              <input type="color" value={subtextColor} onChange={(e) => setSubtextColor(e.target.value)} className="w-6 h-6 rounded border border-stone-200 cursor-pointer p-0" title="Subtext Color" />
              <button type="button" onClick={() => setSubtextColor("")} className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-500 hover:bg-stone-200">Reset</button>
            </div>
          </div>
          <textarea value={subtext} onChange={(e) => setSubtext(e.target.value)} rows={3} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="e.g. Don't wait months for the state. Gain the freedom of the open road on your own schedule..." style={{ color: subtextColor || undefined, fontWeight: subtextColor ? 'bold' : undefined }} />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {saved && <span className="text-sm font-bold text-emerald-600">✅ Saved successfully!</span>}
          {!saved && <span />}
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function SocialLinksEditor() {
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, SITE_CONTENT_BASE, "socials");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setFacebook(d.facebook ?? "");
          setTwitter(d.twitter ?? "");
          setInstagram(d.instagram ?? "");
        }
      } catch (err) {
        console.warn("Socials read failed:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const ref = doc(db, SITE_CONTENT_BASE, "socials");
      await setDoc(ref, {
        facebook: facebook.trim(),
        twitter: twitter.trim(),
        instagram: instagram.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuth.currentUser?.uid,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save social links: " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-stone-300" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-bold text-forest-700 mb-1">Social Media Links</h3>
      <p className="text-sm text-stone-500 mb-2">Add your social media page links below. Only links you fill in will show on the website footer.</p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-xs text-blue-700 leading-relaxed">
        <strong>How to use:</strong> Go to your Facebook, Instagram, or Twitter page and copy the full URL from your browser&apos;s address bar. Paste it into the field below. Leave a field empty to hide that icon.
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-forest-700 mb-1.5">📘 Facebook Page URL</label>
          <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://www.facebook.com/YourPageName" />
        </div>
        <div>
          <label className="block text-sm font-bold text-forest-700 mb-1.5">📸 Instagram Page URL</label>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://www.instagram.com/YourPageName" />
        </div>
        <div>
          <label className="block text-sm font-bold text-forest-700 mb-1.5">🐦 Twitter / X Page URL</label>
          <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://twitter.com/YourPageName" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          {saved && <span className="text-sm font-bold text-emerald-600">✅ Social links saved!</span>}
          {!saved && <span />}
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Social Links
          </button>
        </div>
      </form>
    </div>
  );
}

function AnnouncementsEditor() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState("info");
  const [expires, setExpires] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isBold, setIsBold] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const colRef = collection(db, SITE_CONTENT_BASE, "homepage", "announcements");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Admin Announcements read denied:", err.message);
      setAnnouncements([]);
    });
    return unsub;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const colRef = collection(db, SITE_CONTENT_BASE, "homepage", "announcements");
      const data: Record<string, any> = {
        text: text.trim(),
        type,
        textColor,
        isBold,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: firebaseAuth.currentUser?.uid,
      };
      if (expires) data.expiresAt = Timestamp.fromDate(new Date(expires + "T23:59:59"));
      await addDoc(colRef, data);
      setText("");
      setExpires("");
      setTextColor("#ffffff");
      setIsBold(false);
    } catch (err: any) {
      console.error(err);
      alert("Failed to post announcement: " + err.message);
    }
    setPosting(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const ref = doc(db, SITE_CONTENT_BASE, "homepage", "announcements", id);
    await updateDoc(ref, { active: !currentActive });
  };

  const deleteAnn = async (id: string) => {
    if (!confirm("Delete this announcement permanently?")) return;
    await deleteDoc(doc(db, SITE_CONTENT_BASE, "homepage", "announcements", id));
  };

  const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: "ℹ️" },
    warning: { bg: "bg-gold-50", border: "border-gold-200", icon: "⚠️" },
    promo: { bg: "bg-green-50", border: "border-green-200", icon: "🎉" },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-1">Create Announcement</h3>
        <p className="text-sm text-stone-500 mb-5">Post a banner message on the homepage</p>
        <form onSubmit={handlePost} className="space-y-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="e.g. Holiday closure: We will be closed Dec 24-26." required className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="info">ℹ️ Info</option>
              <option value="warning">⚠️ Warning</option>
              <option value="promo">🎉 Promotion</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-500 shrink-0">Color</label>
              <div className="relative flex-1">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-[42px] rounded-xl border border-stone-200 cursor-pointer bg-stone-50 p-1" />
              </div>
            </div>
            <button type="button" onClick={() => setIsBold(!isBold)} className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${isBold ? "bg-forest-700 text-white border-forest-700" : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"}`}>
              <span className="font-black">B</span> {isBold ? "Bold ON" : "Bold OFF"}
            </button>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={posting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-1">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Post
            </button>
          </div>
          {/* Live Preview */}
          {text.trim() && (
            <div className="bg-stone-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Preview</p>
              <p style={{ color: textColor, fontWeight: isBold ? 700 : 400 }} className="text-sm bg-stone-700 rounded-lg px-4 py-2">{text}</p>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-4">Active Announcements</h3>
        {announcements.length === 0 ? (
          <p className="text-stone-400 text-center py-8 text-sm">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => {
              const style = typeStyles[a.type] || typeStyles.info;
              const isActive = a.active !== false;
              return (
                <div key={a.id} className={`${style.bg} ${style.border} border rounded-xl p-4 ${!isActive ? "opacity-50" : ""} transition-opacity`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span>{style.icon}</span>
                        <span className="text-xs font-bold uppercase text-stone-600">{a.type}</span>
                        {!isActive && <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
                      </div>
                      <p className="text-sm" style={{ color: a.textColor || undefined, fontWeight: a.isBold ? 700 : 500 }}>{a.text}{a.textColor && a.textColor !== "#ffffff" && <span className="ml-2 inline-block w-3 h-3 rounded-full border border-stone-300" style={{ backgroundColor: a.textColor }} />}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => toggleActive(a.id, isActive)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">
                        {isActive ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => deleteAnn(a.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DiscountsEditor() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [packageId, setPackageId] = useState("");
  const [percent, setPercent] = useState("");
  const [label, setLabel] = useState("");
  const [posting, setPosting] = useState(false);

  const packages = [
    { group: "Adult Packages", items: [
      { id: "Adult-Refresher", name: "Adult Refresher Course" },
      { id: "Adult-Basic", name: "Adult Basic Package" },
      { id: "Adult-Intermediate", name: "Adult Intermediate Package" },
      { id: "Adult-Advanced", name: "Adult Advanced Package" },
      { id: "First-Time-Driver", name: "First-Time Driver Essential" },
      { id: "Evaluation", name: "Evaluation Package" },
    ]},
    { group: "Teen Packages", items: [
      { id: "Teen-Basic", name: "Teen Basic Package" },
      { id: "Teen-Standard", name: "Teen Standard Package" },
      { id: "Teen-Premium", name: "Teen Premium Package" },
      { id: "Teen-Advanced", name: "Teen Advanced Package" },
    ]},
    { group: "Knowledge Test", items: [
      { id: "KnowledgeTest-1Attempt", name: "1 Attempt" },
      { id: "KnowledgeTest-2Attempts", name: "2 Attempts" },
      { id: "KnowledgeDriving-Bundle", name: "Knowledge + Driving Bundle" },
    ]},
    { group: "Driving Test", items: [
      { id: "DrivingTest-PersonalCar", name: "Test (Personal Car)" },
      { id: "DrivingTest-SchoolCar", name: "Test (School Car)" },
      { id: "DrivingTest-Plus30m", name: "Test + 30m Practice" },
      { id: "DrivingTest-Plus1h", name: "Test + 1hr Practice" },
    ]},
  ];

  useEffect(() => {
    const colRef = collection(db, SITE_CONTENT_BASE, "homepage", "discounts");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDiscounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Admin Discounts read denied:", err.message);
      setDiscounts([]);
    });
    return unsub;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageId || !percent) return;
    setPosting(true);
    const pkgName = packages.flatMap((g) => g.items).find((i) => i.id === packageId)?.name ?? packageId;
    try {
      const ref = doc(db, SITE_CONTENT_BASE, "homepage", "discounts", packageId);
      await setDoc(ref, {
        packageId,
        packageName: pkgName,
        percent: parseInt(percent),
        label: label.trim(),
        active: true,
        createdAt: serverTimestamp(),
        createdBy: firebaseAuth.currentUser?.uid,
      });
      setPackageId("");
      setPercent("");
      setLabel("");
    } catch (err: any) {
      console.error(err);
      alert("Failed to post discount: " + err.message);
    }
    setPosting(false);
  };

  const toggleDiscount = async (id: string, currentActive: boolean) => {
    await updateDoc(doc(db, SITE_CONTENT_BASE, "homepage", "discounts", id), { active: !currentActive });
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm("Delete this discount?")) return;
    await deleteDoc(doc(db, SITE_CONTENT_BASE, "homepage", "discounts", id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-1">Create Discount Ribbon</h3>
        <p className="text-sm text-stone-500 mb-5">Add a pricing discount and ribbon to a service package</p>
        <form onSubmit={handlePost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-500 mb-1.5">Target Package</label>
              <select value={packageId} onChange={(e) => setPackageId(e.target.value)} required className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" disabled>Select a package…</option>
                {packages.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5">Discount %</label>
              <input type="number" min="1" max="100" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="e.g. 15" required className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5">Custom Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. SPRING SALE" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={posting} className="bg-gold-500 hover:bg-gold-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-60 text-sm flex items-center gap-1">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Apply Discount
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-4">Active Package Discounts</h3>
        {discounts.length === 0 ? (
          <p className="text-stone-400 text-center py-8 text-sm">No active discounts.</p>
        ) : (
          <div className="space-y-3">
            {discounts.map((d) => {
              const isActive = d.active !== false;
              return (
                <div key={d.id} className={`bg-gold-50 border border-gold-200 rounded-xl p-4 ${!isActive ? "opacity-50" : ""} transition-opacity`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>🎟️</span>
                        <span className="text-xs font-bold uppercase text-gold-800">{d.packageName}</span>
                        {!isActive && <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">HIDDEN</span>}
                      </div>
                      <p className="text-sm font-medium text-stone-800">Discount: <span className="font-bold text-red-600">{d.percent}%</span> — Ribbon: &ldquo;{d.label || `${d.percent}% OFF`}&rdquo;</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => toggleDiscount(d.id, isActive)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">{isActive ? "Hide" : "Show"}</button>
                      <button onClick={() => deleteDiscount(d.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


/* ── Packages Tab ── */
function PackagesTab() {
  const [activeCategory, setActiveCategory] = useState<string>("Adult-Packages");
  const [packages, setPackages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, `artifacts/${APP_ID}/public/data/packages/${activeCategory}/list`), orderBy("sortOrder", "asc")), (snap) => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Packages read denied (expected until firestore.rules deployed):", err.message);
    });
    return unsub;
  }, [activeCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, `artifacts/${APP_ID}/public/data/packages/${activeCategory}/list`, editing.id), {
        name: editing.name,
        price: Number(editing.price),
        subtitle: editing.subtitle,
        hours: Number(editing.hours),
        requiredDrives: Number(editing.requiredDrives),
        isActive: editing.isActive,
        isPopular: editing.isPopular || false,
        features: editing.features,
        paymentLink: editing.paymentLink || "", // Dynamic Clover Link
      });
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save. Because production rules aren't deployed, Google hasn't whitelisted this action yet.");
    }
    setSaving(false);
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const newF = [...editing.features];
    newF[index] = { ...newF[index], [field]: value };
    setEditing({ ...editing, features: newF });
  };
  const addFeature = () => {
    setEditing({ ...editing, features: [...(editing.features || []), { text: "New feature", included: true }] });
  };
  const removeFeature = (index: number) => {
    const newF = [...editing.features];
    newF.splice(index, 1);
    setEditing({ ...editing, features: newF });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-2 flex-wrap">
        {["Adult-Packages", "Teen-Packages", "Knowledge-Test-Options", "Driving-Test-Options"].map(cat => (
          <button key={cat} onClick={() => { setActiveCategory(cat); setEditing(null); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeCategory === cat ? "bg-forest-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
            {cat.replace("-Packages", "").replace("-Options", "").replace(/-/g, " ")}
          </button>
        ))}
      </div>

      {!editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.length === 0 && <p className="text-stone-500 text-sm">No packages loaded. Ensure database is seeded.</p>}
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white border text-sm border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-forest-700">{pkg.name}</h3>
                  <span className="font-bold text-emerald-600">${pkg.price}</span>
                </div>
                <p className="text-stone-500 mb-3 text-xs">{pkg.subtitle}</p>
                <div className="flex gap-2 mb-4">
                  {pkg.isActive ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[10px]">ACTIVE</span> : <span className="bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md font-bold text-[10px]">INACTIVE</span>}
                  {pkg.isPopular && <span className="bg-gold-100 text-gold-700 px-2 py-0.5 rounded-md font-bold text-[10px]">POPULAR</span>}
                </div>
              </div>
              <button onClick={() => setEditing(pkg)} className="w-full bg-stone-100 hover:bg-stone-200 text-forest-700 font-bold py-2 rounded-xl transition-colors">Edit Package</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-forest-700 text-lg">Editing: {editing.name}</h3>
            <button onClick={() => setEditing(null)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-stone-500 mb-1">Name</label>
              <input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required /></div>
              <div><label className="block text-xs font-bold text-stone-500 mb-1">Price ($)</label>
              <input type="number" value={editing.price} onChange={e => setEditing({...editing, price: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-stone-500 mb-1">Subtitle</label>
              <input value={editing.subtitle} onChange={e => setEditing({...editing, subtitle: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gold-600 mb-1">Clover Payment Link (URL)</label>
              <input value={editing.paymentLink || ""} onChange={e => setEditing({...editing, paymentLink: e.target.value})} placeholder="https://link.clover.com/..." className="w-full px-3 py-2 bg-gold-50 border border-gold-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-bold text-stone-500 mb-1">Course Hours</label>
              <input type="number" value={editing.hours} onChange={e => setEditing({...editing, hours: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required /></div>
              <div><label className="block text-xs font-bold text-stone-500 mb-1">Required Drives</label>
              <input type="number" value={editing.requiredDrives} onChange={e => setEditing({...editing, requiredDrives: e.target.value})} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" required /></div>
            </div>
            
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-600 cursor-pointer">
                <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({...editing, isActive: e.target.checked})} className="w-4 h-4 rounded text-blue-600" /> Active (Visible to public)
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-stone-600 cursor-pointer">
                <input type="checkbox" checked={editing.isPopular || false} onChange={e => setEditing({...editing, isPopular: e.target.checked})} className="w-4 h-4 rounded text-gold-500" /> Highlight as &quot;Popular&quot;
              </label>
            </div>

            <div className="pt-4 border-t border-stone-100">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-stone-500">Included Features Checkmarks</label>
                <button type="button" onClick={addFeature} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100">+ Add Feature</button>
              </div>
              <div className="space-y-2">
                {editing.features?.map((f: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <button type="button" onClick={() => updateFeature(i, "included", !f.included)} className={`px-2 py-1.5 rounded-lg text-xs font-bold w-12 shrink-0 ${f.included ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {f.included ? "YES" : "NO"}
                    </button>
                    <input value={f.text} onChange={e => updateFeature(i, "text", e.target.value)} className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 focus:ring-2 focus:outline-none focus:ring-blue-500 text-sm rounded-lg" />
                    <button type="button" onClick={() => removeFeature(i)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-60 flex justify-center text-sm">
                {saving ? "Saving..." : "Save Package"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const functions = getFunctions();
      const promoteFn = httpsCallable(functions, "addAdminRole");
      await promoteFn({ email: email.trim() });
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h3 className="font-bold text-forest-700 mb-1">Promote User to Admin</h3>
        <p className="text-sm text-stone-500 mb-5">Grant admin dashboard access to another user</p>
        <form onSubmit={handlePromote} className="flex items-center gap-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={status === "loading"} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-60 text-sm shrink-0">
            {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Promote"}
          </button>
        </form>
        {status === "success" && <p className="mt-3 text-sm font-bold text-emerald-600">✅ User promoted to admin!</p>}
        {status === "error" && <p className="mt-3 text-sm font-bold text-red-600">❌ Failed to promote user. Check console.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN ADMIN LAYOUT
   ═══════════════════════════════════════════════ */
export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin claim
  useEffect(() => {
    if (!user) return;
    user.getIdTokenResult().then((result) => {
      setIsAdmin(result.claims.admin === true);
    }).catch(() => setIsAdmin(false));
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
        <div className="w-10 h-10 border-4 border-forest-700/20 border-t-forest-700 rounded-full animate-spin" />
        <p className="text-sm text-stone-400 font-semibold">Loading Admin Portal...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-forest-700 mb-2">Access Denied</h2>
          <p className="text-stone-500 text-sm mb-6">Your account does not have administrator privileges. Contact your administrator to request access.</p>
          <button onClick={() => { logout(); router.push("/"); }} className="bg-forest-700 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-forest-800 transition-all text-sm">
            Sign Out & Return Home
          </button>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "appointments": return <AppointmentsTab />;
      case "students": return <StudentsTab />;
      case "sessions": return <SessionsTab />;
      case "payments": return <PaymentTrackingTab />;
      case "schedule": return <ScheduleTab />;
      case "availability": return <AvailabilityTab />;
      case "cms": return <CMSTab />;
      case "packages": return <PackagesTab />;
      case "settings": return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-16">
      {/* ── Sidebar ── */}
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-stone-100 z-40 py-4 px-2">
        <div className="flex items-center gap-2 px-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-forest-700 rounded-lg flex items-center justify-center shadow-md">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-extrabold text-forest-700">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <button onClick={() => { logout(); router.push("/"); }} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </aside>

      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed bottom-4 left-4 z-40 w-12 h-12 bg-forest-700 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ duration: 0.25 }} className="w-64 h-full bg-white py-4 px-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-3 mb-4">
                <span className="text-sm font-extrabold text-forest-700">Admin Panel</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-400" /></button>
              </div>
              <nav className="space-y-0.5">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-stone-500 hover:bg-stone-50"}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="lg:ml-56 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Tab Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-forest-700">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>

          {/* Active Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
