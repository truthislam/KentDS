"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function PaymentReturnContent() {
  const [status, setStatus] = useState<"processing" | "success" | "failure">("processing");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processPaymentResult = async () => {
      const urlStatus = searchParams.get("status");

      if (!urlStatus) {
        // No status parameter - redirect to dashboard
        router.push("/dashboard");
        return;
      }

      try {
        // Wait for auth to be ready
        await new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
          });
        });

        if (!auth.currentUser) {
          // Not logged in - redirect to login
          router.push("/dashboard"); // Next.js dashboard auto-redirects to home if not logged in
          return;
        }

        const pendingEnrollmentRaw = sessionStorage.getItem("pendingEnrollment");
        const pendingEnrollment = pendingEnrollmentRaw ? JSON.parse(pendingEnrollmentRaw) : {};

        const functions = getFunctions();

        if (urlStatus === "success") {
          // Payment successful - call Cloud Function to finalize enrollment
          const handleSuccess = httpsCallable(functions, "handlePaymentSuccess");
          await handleSuccess({
            packageId: pendingEnrollment.packageId,
            packageName: pendingEnrollment.packageName,
            packagePrice: pendingEnrollment.packagePrice,
          });

          // Clear pending enrollment
          sessionStorage.removeItem("pendingEnrollment");

          // Show success view
          setStatus("success");
        } else {
          // Payment failed
          const handleFailure = httpsCallable(functions, "handlePaymentFailure");
          if (pendingEnrollment.packageId) {
             await handleFailure({
               packageId: pendingEnrollment.packageId,
               packageName: pendingEnrollment.packageName,
               packagePrice: pendingEnrollment.packagePrice,
             }).catch(console.error); // Best effort
          }

          // Show failure view
          setStatus("failure");
        }
      } catch (error) {
        console.error("Error processing payment result:", error);
        // Show failure view on error
        setStatus("failure");
      }
    };

    processPaymentResult();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
        {status === "processing" && (
          <div id="processing-view" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Loader2 className="w-16 h-16 animate-spin text-gold-500 mx-auto mb-6" />
            <h1 className="text-2xl font-extrabold text-forest-900 mb-2">Processing Your Payment...</h1>
            <p className="text-stone-500 mb-6">Please wait while we confirm your enrollment.</p>
          </div>
        )}

        {status === "success" && (
          <div id="success-view" className="animate-in zoom-in duration-500">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-2xl font-extrabold text-forest-900 mb-2">Payment Successful!</h1>
            <p className="text-stone-600 mb-4 font-medium">Welcome to Discount Driving School!</p>
            <p className="text-sm text-stone-500 mb-8">You can now access your dashboard and schedule appointments.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-block bg-forest-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-forest-600 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === "failure" && (
          <div id="failure-view" className="animate-in zoom-in duration-500">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-extrabold text-red-600 mb-2">Payment Issue</h1>
            <p className="text-stone-700 mb-4 font-medium">We couldn't complete your payment.</p>
            <p className="text-sm text-stone-600 mb-6">
              Don't worry - your account has been created. Our team has been notified and will contact you shortly
              to help complete your enrollment.
            </p>
            <div className="bg-stone-50 p-5 rounded-xl mb-8 text-left border border-stone-100">
              <p className="font-bold text-forest-900 mb-2">Need immediate help?</p>
              <p className="text-sm text-stone-700 mb-1">
                📞 Call: <a href="tel:(206)851-6647" className="text-blue-600 font-medium">(206) 551-9748</a>
              </p>
              <p className="text-sm text-stone-700">
                ✉️ Email: <a href="mailto:kentdiscountdriving@gmail.com" className="text-blue-600 font-medium">kentdiscountdriving@gmail.com</a>
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-block bg-stone-200 text-stone-700 px-8 py-3.5 rounded-xl font-bold hover:bg-stone-300 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
         <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}
