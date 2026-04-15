// --- Imports: v2 HTTPS + v1 Auth triggers ---
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as functionsV1 from "firebase-functions/v1";
import admin from "firebase-admin";
// Import email templates
import {
  getWelcomeEmailTemplate,
  getAppointmentConfirmationTemplate,
  getAppointmentCancellationTemplate,
  getAdminNotificationTemplate,
  getNewStudentNotificationTemplate,
  getStudentRegistrationConfirmationTemplate,
  getPaymentFailureNotificationTemplate,
  getTestRegistrationReceivedTemplate,
  getTestPendingPaymentAdminTemplate,
  getTestBookingConfirmedTemplate,
  getTestBookingPaidAdminTemplate,
  getPasswordResetTemplate,
} from "./email-templates.js";

// --- Init ---
admin.initializeApp();
const db = admin.firestore();

// Use the human-friendly app namespace you standardized on
const appId = "kent";

// --- Helpers ---
// NOTE: Email is handled by Firebase Trigger Email Extension with SMTP2GO
// The extension watches the 'mail' collection and sends emails automatically

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends email via Firebase Trigger Email Extension
 * Extension watches the 'mail' collection and sends via SMTP2GO
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Plain text message
 * @param {string} [htmlMessage] - Optional HTML message
 * @param {string} [bcc] - Optional BCC address
 * @param {string} [customDocId] - Optional deterministic ID for idempotency
 */
async function sendEmail(
  to,
  subject,
  message,
  htmlMessage = null,
  bcc = null,
  customDocId = null
) {
  try {
    // Create email document for Firebase Trigger Email Extension
    const emailDoc = {
      to: [to],
      message: {
        subject: subject,
        text: message,
        html: htmlMessage || `<p>${message.replace(/\n/g, "<br>")}</p>`,
      },
    };

    // Add BCC if provided
    if (bcc) {
      emailDoc.bcc = [bcc];
    }

    // Add delivery metadata (Extension updates these)
    emailDoc.delivery = {
      startTime: admin.firestore.Timestamp.now(),
      state: "PENDING",
      attempts: 0,
      error: null,
    };

    const mailCol = db
      .collection("artifacts")
      .doc(appId)
      .collection("public")
      .doc("data")
      .collection("mail");

    let mailRef;
    if (customDocId) {
      mailRef = mailCol.doc(customDocId);
      await mailRef.set(emailDoc, { merge: true });
      console.log(
        `âœ… Email set with deterministic ID: ${customDocId} for ${to}`
      );
    } else {
      mailRef = await mailCol.add(emailDoc);
      console.log(`âœ… Email queued for ${to} (Document ID: ${mailRef.id})`);
    }

    return mailRef.id || customDocId;
  } catch (err) {
    console.error("âŒ Email Queue Error:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------
// FIRESTORE TRIGGERS
// ---------------------------------------------------------------------

/**
 * Firestore trigger: Clean up mail documents after successful delivery
 * Firebase Trigger Email Extension updates delivery.state to 'SUCCESS'
 * This trigger deletes the document to maintain zero-persistence for emails
 */
export const cleanupMailOnDelivery = functionsV1.firestore
  .document("artifacts/{appId}/public/data/mail/{mailId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    // Check if delivery state changed to SUCCESS
    if (
      after.delivery?.state === "SUCCESS" &&
      before.delivery?.state !== "SUCCESS"
    ) {
      try {
        // Delete the mail document after successful delivery
        await change.after.ref.delete();
        console.log(
          `âœ… Cleaned up mail document ${context.params.mailId} after successful delivery`
        );
      } catch (err) {
        console.error(
          `âŒ Failed to clean up mail document ${context.params.mailId}:`,
          err
        );
      }
    }

    // Also clean up if delivery failed after max retries
    if (after.delivery?.state === "ERROR" && after.delivery?.attempts >= 3) {
      try {
        await change.after.ref.delete();
        console.log(
          `ðŸ—‘ï¸ Cleaned up failed mail document ${context.params.mailId} after 3 attempts`
        );
      } catch (err) {
        console.error(
          `âŒ Failed to clean up failed mail document ${context.params.mailId}:`,
          err
        );
      }
    }
  });

// --- Helpers ---

function splitName(displayName = "") {
  const parts = displayName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

// ---------------------------------------------------------------------
// v1 AUTH TRIGGERS
// ---------------------------------------------------------------------
// Auto-create student profile for ANY signup (Google, email/password, etc.)
export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  const studentRef = db.doc(
    `artifacts/${appId}/public/data/students/${user.uid}`
  );
  const { firstName, lastName } = splitName(user.displayName || "");

  // Build payload with only non-empty values
  const studentProfile = {
    uid: user.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Only add fields that have actual values (not empty strings)
  if (user.email) studentProfile.email = user.email;
  if (firstName) studentProfile.firstName = firstName;
  if (lastName) studentProfile.lastName = lastName;
  if (user.phoneNumber) studentProfile.phoneNumber = user.phoneNumber;
  // Do NOT write enrolledPackage: null - let frontend handle it

  try {
    await studentRef.set(studentProfile, { merge: true });
    console.log(`âœ… Created student profile for ${user.email}`);

    // NOTE: Pre-payment emails (Admin & Student) are now handled by
    // the Firestore onCreate trigger: onStudentProfileCreated
    // which ensures all profile fields (name, phone, package) are present.

    // Optional: auto-admin certain emails
    const adminEmails = ["kentdiscountdriving@gmail.com"];
    if (user.email && adminEmails.includes(user.email)) {
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`ðŸ‘‘ ${user.email} promoted to admin`);
    }
  } catch (err) {
    console.error("âŒ onUserCreated error:", err);
  }
});

/**
 * Helper: Send registration emails ONLY when profile is complete
 */
async function sendRegistrationEmails(studentId, data) {
  // Prevent duplicate sends
  if (data.registrationEmailSent) return;

  const { firstName, lastName, email, phoneNumber, enrolledPackage } = data;

  // Crucial: Only send if we have the minimum required fields
  // enrolledPackage must exist and have a name
  if (!firstName || !lastName || !email || !enrolledPackage?.name) {
    console.log(
      `â³ Registration data for ${studentId} still incomplete. Waiting...`
    );
    return;
  }

  // SUPPRESS: If this is a test registration, skip these generic emails.
  // The specific test confirmation is handled by bookAppointment().
  const pkgName = (
    enrolledPackage.name ||
    enrolledPackage.packageName ||
    ""
  ).toLowerCase();

  // Robust check: Flag is set by frontend, fallback to string matching
  const isTest =
    enrolledPackage.isTest === true ||
    pkgName.includes("test") ||
    pkgName.includes("knowledge") ||
    pkgName.includes("driving");

  if (isTest) {
    console.log(
      `â„¹ï¸ Suppressing generic registration email for Test: ${pkgName}`
    );
    return;
  }

  try {
    const studentInfo = {
      firstName: firstName || "Student",
      lastName: lastName || "",
      email: email || "N/A",
      phoneNumber: phoneNumber || "N/A",
    };

    const packageInfo = {
      packageName: enrolledPackage.name,
      packagePrice: enrolledPackage.price || "N/A",
      sessionType: enrolledPackage.teenSession
        ? "Teen Course Enrollment"
        : "Course Enrollment",
      teenSession: enrolledPackage.teenSession || null,
    };

    // DETERMINISTIC IDs: Prevent Trigger Email from sending duplicates if triggers collide
    const studentMailId = `reg_student_${studentId}`;
    const adminMailId = `reg_admin_${studentId}`;

    // 1. Student Confirmation (Green "Booking Confirmed")
    const studentHtml = getStudentRegistrationConfirmationTemplate(
      studentInfo,
      packageInfo
    );
    await sendEmail(
      email,
      `Booking Confirmation: ${packageInfo.packageName}`,
      `Dear ${firstName}, your registration for ${packageInfo.packageName} at Discount Driving School has been confirmed.`,
      studentHtml,
      null,
      studentMailId
    );

    // 2. Admin Notification (Blue "New Booking Received")
    const adminHtml = getNewStudentNotificationTemplate(
      studentInfo,
      packageInfo
    );
    await sendEmail(
      "kentdiscountdriving@gmail.com",
      `New Booking: ${firstName} ${lastName} - ${packageInfo.packageName}`,
      `New booking received for ${firstName} ${lastName}.`,
      adminHtml,
      null,
      adminMailId
    );

    // Mark as sent to prevent duplicates across triggers
    await db
      .doc(`artifacts/${appId}/public/data/students/${studentId}`)
      .update({
        registrationEmailSent: true,
        registrationEmailsSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`ðŸ“§ Idempotent notifications queued and marked for ${email}`);
  } catch (err) {
    console.error(
      `âŒ Failed to send registration emails for ${studentId}:`,
      err
    );
  }
}

/**
 * Firestore trigger: Send notifications when a new student profile is created
 */
export const onStudentProfileCreated = functionsV1.firestore
  .document(`artifacts/${appId}/public/data/students/{studentId}`)
  .onCreate(async (snap, context) => {
    await sendRegistrationEmails(context.params.studentId, snap.data());
  });

/**
 * Firestore trigger: Send notifications when a student profile is updated
 * This catches cases where Auth trigger created the doc first, and then frontend filled it.
 */
export const onStudentProfileUpdated = functionsV1.firestore
  .document(`artifacts/${appId}/public/data/students/{studentId}`)
  .onUpdate(async (change, context) => {
    await sendRegistrationEmails(context.params.studentId, change.after.data());
  });

// Optional cleanup (if you want to remove the Firestore student doc on Auth deletion)
export const onUserDeleted = functionsV1.auth.user().onDelete(async (user) => {
  try {
    await db
      .doc(`artifacts/${appId}/public/data/students/${user.uid}`)
      .delete();
    console.log(`ðŸ—‘ï¸ Deleted student profile for ${user.email}`);
  } catch (err) {
    console.error("âŒ onUserDeleted error:", err);
  }
});

// ---------------------------------------------------------------------
// v2 HTTPS CALLABLES
// ---------------------------------------------------------------------
// Admin: grant admin by email
export const addAdminRole = onCall(async (request) => {
  const email = request.data?.email;
  if (!email) throw new HttpsError("invalid-argument", "Email required.");
  const caller = request.auth?.token;
  if (!caller?.admin) throw new HttpsError("permission-denied", "Admin only.");

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    return { message: `User ${email} promoted to admin.` };
  } catch (err) {
    console.error(err);
    throw new HttpsError("not-found", "User not found.");
  }
});

// Manual profile sync (use this instead of a non-existent onUpdate trigger)
// Call this after Google sign-in or from a settings page to refresh names/email.
// syncProfileFromAuth — REMOVED (orphaned: never called from frontend,
// onUserCreated trigger already handles profile syncing)

// Delete a student (admin only)
export const deleteStudentAccount = onCall(async (request) => {
  const { studentId } = request.data || {};
  const caller = request.auth?.token;
  if (!caller?.admin) throw new HttpsError("permission-denied", "Admin only.");
  if (!studentId)
    throw new HttpsError("invalid-argument", "studentId required.");

  try {
    // Remove appointments for this student
    const appointmentsRef = db
      .collection(`artifacts/${appId}/public/data/appointments`)
      .where("userId", "==", studentId);
    const snapshot = await appointmentsRef.get();
    const batch = db.batch();
    snapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    await db
      .doc(`artifacts/${appId}/public/data/students/${studentId}`)
      .delete();
    await admin.auth().deleteUser(studentId);

    return { message: `Student ${studentId} deleted successfully.` };
  } catch (err) {
    console.error("deleteStudentAccount error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message || "Unknown error");
  }
});

// Book appointment
export const bookAppointment = onCall(async (request) => {
  const {
    availabilityId,
    sessionType,
    guestName,
    guestPhone,
    guestEmail,
    testName,
  } = request.data;
  const uid = request.auth?.uid;
  const stLower = (sessionType || "").toLowerCase();
  const isTestBooking =
    stLower.startsWith("knowledge test") ||
    stLower.startsWith("driving test") ||
    stLower.includes("knowledge + driving");
  if (!isTestBooking && !uid)
    throw new HttpsError("unauthenticated", "You must be signed in.");

  try {
    let studentData = {};
    let studentRef = null;

    if (uid) {
      // Verify student has active enrollment and completed payment
      studentRef = db.doc(`artifacts/${appId}/public/data/students/${uid}`);
      const studentSnap = await studentRef.get();
      if (!studentSnap.exists) {
        throw new HttpsError(
          "not-found",
          "Student profile not found. Please complete registration."
        );
      }
      studentData = studentSnap.data();
    }

    // Check payment status - Skip check for Knowledge/Driving Tests booked via the test flow
    if (!isTestBooking && studentData.paymentStatus !== "completed") {
      throw new HttpsError(
        "permission-denied",
        "You must complete your payment to book sessions. Please use the 'I Already Paid' button or contact support if you believe this is an error."
      );
    }

    // Check appointment cap based on package limits
    const maxDrives = studentData.enrolledPackage?.requiredDrives || 6;
    const appointmentsRef = db.collection(
      `artifacts/${appId}/public/data/appointments`
    );
    const existingAppointmentsSnap = await appointmentsRef
      .where("userId", "==", uid || "GUEST")
      .get();

    if (!isTestBooking && existingAppointmentsSnap.size >= maxDrives) {
      throw new HttpsError(
        "resource-exhausted",
        `You have reached your package limit of ${maxDrives} appointments. Contact us to upgrade your package.`
      );
    }

    let authFirstName = "Guest";
    let authLastName = "";
    let authEmail = "";

    if (uid) {
      try {
        const userRecord = await admin.auth().getUser(uid);
        const displayNameParts = (userRecord.displayName || "")
          .trim()
          .split(" ");
        authFirstName = displayNameParts[0] || "Student";
        authLastName = displayNameParts.slice(1).join(" ") || "";
        authEmail = userRecord.email || "";
      } catch (e) {
        // User record might not exist or error
      }
    }

    // Resolve student contact info: prefer Firestore profile fields, fall back to guest fields or auth displayName
    const studentFirstName =
      guestName?.split(" ")[0] || studentData.firstName || authFirstName;
    const studentLastName =
      guestName?.split(" ").slice(1).join(" ") ||
      studentData.lastName ||
      authLastName;
    const studentEmail = guestEmail || studentData.email || authEmail || "";
    const studentPhone = guestPhone || studentData.phoneNumber || "";

    // ATOMIC LOCK & BOOKING TRANSACTION
    const apptRef = db
      .collection(`artifacts/${appId}/public/data/appointments`)
      .doc();

    // Test bookings use virtual slot IDs (e.g. "t-0900") generated client-side.
    // We must detect these and create a real availability doc on-the-fly.
    const isVirtualSlot =
      isTestBooking && availabilityId && availabilityId.startsWith("t-");

    let availRef;
    if (isVirtualSlot) {
      // Parse date and time from the request data instead of a non-existent doc
      const { requestedDate, requestedTime } = request.data;
      if (!requestedDate || !requestedTime) {
        throw new HttpsError(
          "invalid-argument",
          "Test bookings require requestedDate and requestedTime."
        );
      }
      // Create a new availability doc for this test slot
      availRef = db
        .collection(`artifacts/${appId}/public/data/availability`)
        .doc();
    } else {
      availRef = db.doc(
        `artifacts/${appId}/public/data/availability/${availabilityId}`
      );
    }

    const slot = await db.runTransaction(async (transaction) => {
      let slotData;

      if (isVirtualSlot) {
        const { requestedDate, requestedTime } = request.data;
        // Check if an identical test slot was already booked (prevent double-booking same time)
        // We can't query inside a transaction, so we use the generated doc — collisions are
        // handled by the unique appointment doc below
        slotData = { date: requestedDate, time: requestedTime };

        // Create the real availability doc, already booked
        transaction.set(availRef, {
          date: requestedDate,
          time: requestedTime,
          isBooked: true,
          bookedBy: uid || "GUEST",
          isTestSlot: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Regular slots — look up the existing availability doc
        const availSnap = await transaction.get(availRef);
        if (!availSnap.exists)
          throw new HttpsError("not-found", "Slot not found.");
        slotData = availSnap.data();
        if (slotData.isBooked)
          throw new HttpsError(
            "failed-precondition",
            "Slot is no longer available. Please select another time."
          );

        // Lock the slot
        transaction.update(availRef, {
          isBooked: true,
          bookedBy: uid || "GUEST",
        });
      }

      // Create the appointment precisely tied to the lock
      transaction.set(apptRef, {
        userId: uid || null,
        date: slotData.date,
        time: slotData.time,
        sessionType,
        studentName: `${studentFirstName} ${studentLastName}`.trim() || "Guest",
        instructorId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentStatus: isTestBooking ? "pending" : "not_applicable",
      });

      return slotData;
    });

    // Post-transaction (Non-atomic operations)
    // Save guest contact info to student profile if not already set (only if logged in)
    if (uid && studentRef) {
      const profileUpdate = {};
      if (!studentData.firstName && studentFirstName)
        profileUpdate.firstName = studentFirstName;
      if (!studentData.lastName && studentLastName)
        profileUpdate.lastName = studentLastName;
      if (!studentData.phoneNumber && studentPhone)
        profileUpdate.phoneNumber = studentPhone;
      if (Object.keys(profileUpdate).length > 0) {
        await studentRef.set(profileUpdate, { merge: true });
      }
    }

    if (isTestBooking) {
      // --- DELAYED EMAIL SYSTEM ---
      // Do NOT send emails immediately. Store a pending notification doc.
      // A scheduled function will send emails after 7 minutes if payment is not confirmed.
      const sendAfter = new Date(Date.now() + 7 * 60 * 1000); // 7 minutes from now
      await db
        .collection(`artifacts/${appId}/public/data/pendingTestNotifications`)
        .doc(apptRef.id)
        .set({
          appointmentId: apptRef.id,
          userId: uid || null,
          studentFirstName,
          studentLastName,
          studentEmail,
          studentPhone,
          testName: testName || sessionType,
          date: slot.date,
          time: slot.time,
          sessionType,
          sendAfter: admin.firestore.Timestamp.fromDate(sendAfter),
          sent: false,
          paymentConfirmed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      console.log(
        `ðŸ“‹ Pending test notification queued for appointment ${apptRef.id} â€” sends after ${sendAfter.toISOString()}`
      );
    } else {
      // Non-test (lesson): send confirmation emails immediately as before
      const dashboardUrl = `https://kentdiscountdrivingschool.com/dashboard.html`;
      const confirmationHtml = getAppointmentConfirmationTemplate(
        `${studentFirstName} ${studentLastName}`.trim() || "Student",
        { date: slot.date, time: slot.time, sessionType, instructorName: null },
        dashboardUrl
      );
      await sendEmail(
        studentEmail,
        `Appointment Confirmed: ${sessionType}`,
        `Your ${sessionType} appointment for ${slot.date} at ${slot.time} is confirmed.`,
        confirmationHtml
      );

      const adminHtml = getAdminNotificationTemplate(
        `${studentFirstName} ${studentLastName}`.trim() || "Student",
        studentEmail,
        {
          date: slot.date,
          time: slot.time,
          sessionType,
          bookingType: "Student Dashboard Booking",
          phoneNumber: studentPhone,
        }
      );
      await sendEmail(
        "kentdiscountdriving@gmail.com",
        `New Booking: ${sessionType} - ${studentFirstName} ${studentLastName}`,
        `New appointment booked for ${studentFirstName} ${studentLastName} on ${slot.date} at ${slot.time}`,
        adminHtml
      );
    }

    return {
      success: true,
      message: "Appointment booked successfully.",
      appointmentId: apptRef.id,
    };
  } catch (err) {
    console.error(err);
    throw new HttpsError("internal", err.message);
  }
});

/**
 * confirmTestPayment â€” called by frontend when user returns from Clover after paying.
 * Cancels the pending delayed notification and sends immediate confirmed emails.
 */
export const confirmTestPayment = onCall(async (request) => {
  const { appointmentId, packageId, packageName, price } = request.data || {};
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required.");
  if (!appointmentId)
    throw new HttpsError("invalid-argument", "appointmentId required.");

  try {
    const pendingRef = db.doc(
      `artifacts/${appId}/public/data/pendingTestNotifications/${appointmentId}`
    );
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      console.log(
        `â„¹ï¸ No pending notification found for appointment ${appointmentId} â€” may have already been processed.`
      );
      return { success: true, message: "No pending notification found." };
    }

    const pending = pendingSnap.data();

    // Mark as payment confirmed and sent so the scheduled function won't send duplicate emails
    await pendingRef.update({ paymentConfirmed: true, sent: true });

    // Mark appointment as paid
    await db
      .doc(`artifacts/${appId}/public/data/appointments/${appointmentId}`)
      .update({
        paymentStatus: "completed",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const studentData = {
      firstName: pending.studentFirstName,
      lastName: pending.studentLastName,
      email: pending.studentEmail,
      phoneNumber: pending.studentPhone,
    };
    const appointmentDetails = {
      date: pending.date,
      time: pending.time,
      sessionType: pending.sessionType,
      testName: pending.testName,
      price: price || null,
    };

    // Send immediate "Booking Confirmed" email to client
    const clientHtml = getTestBookingConfirmedTemplate(
      studentData,
      appointmentDetails
    );
    await sendEmail(
      pending.studentEmail,
      `Booking Confirmed: ${pending.testName || pending.sessionType}`,
      `Your ${pending.sessionType} on ${pending.date} at ${pending.time} is confirmed and paid.`,
      clientHtml
    );

    // Send immediate "Booking Paid" notification to admin
    const adminHtml = getTestBookingPaidAdminTemplate(
      studentData,
      appointmentDetails
    );
    await sendEmail(
      "kentdiscountdriving@gmail.com",
      `âœ… Test Booking Paid: ${pending.studentFirstName} ${pending.studentLastName} â€” ${pending.testName || pending.sessionType}`,
      `Payment confirmed for ${pending.studentFirstName} ${pending.studentLastName} â€” ${pending.sessionType} on ${pending.date}.`,
      adminHtml
    );

    console.log(
      `âœ… Payment confirmed emails sent for appointment ${appointmentId}`
    );
    return { success: true, message: "Payment confirmed and emails sent." };
  } catch (err) {
    console.error("confirmTestPayment error:", err);
    throw new HttpsError("internal", err.message);
  }
});

/**
 * processTestPendingNotifications â€” runs every minute.
 * Sends delayed emails to clients/admin for test bookings where payment was NOT completed.
 */
export const processTestPendingNotifications = onSchedule(
  "every 1 minutes",
  async () => {
    const now = admin.firestore.Timestamp.now();
    const pendingCol = db.collection(
      `artifacts/${appId}/public/data/pendingTestNotifications`
    );

    const snap = await pendingCol
      .where("sent", "==", false)
      .where("paymentConfirmed", "==", false)
      .where("sendAfter", "<=", now)
      .get();

    if (snap.empty) {
      console.log("â° No pending test notifications to send.");
      return;
    }

    const sends = snap.docs.map(async (docSnap) => {
      const pending = docSnap.data();
      try {
        const studentData = {
          firstName: pending.studentFirstName,
          lastName: pending.studentLastName,
          email: pending.studentEmail,
          phoneNumber: pending.studentPhone,
        };
        const appointmentDetails = {
          date: pending.date,
          time: pending.time,
          sessionType: pending.sessionType,
          testName: pending.testName,
        };

        // Send delayed "Registration Received" email to client
        const clientHtml = getTestRegistrationReceivedTemplate(
          studentData,
          appointmentDetails
        );
        await sendEmail(
          pending.studentEmail,
          `Registration Received: ${pending.testName || pending.sessionType}`,
          `We received your registration for ${pending.sessionType} on ${pending.date} at ${pending.time}. Complete payment to confirm.`,
          clientHtml
        );

        // Send delayed "Payment Pending" notification to admin
        const adminHtml = getTestPendingPaymentAdminTemplate(
          studentData,
          appointmentDetails
        );
        await sendEmail(
          "kentdiscountdriving@gmail.com",
          `âš ï¸ Payment Pending: ${pending.studentFirstName} ${pending.studentLastName} â€” ${pending.testName || pending.sessionType}`,
          `${pending.studentFirstName} ${pending.studentLastName} registered for ${pending.sessionType} but has not completed payment.`,
          adminHtml
        );

        // Mark as sent so we don't re-process
        await docSnap.ref.update({
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(
          `ðŸ“§ Delayed test notification sent for appointment ${pending.appointmentId}`
        );
      } catch (err) {
        console.error(
          `âŒ Failed to send delayed notification for ${docSnap.id}:`,
          err
        );
      }
    });

    await Promise.all(sends);
  }
);

// Cancel (user)
export const cancelAppointment = onCall(async (request) => {
  const { appointmentId } = request.data || {};
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required.");
  if (!appointmentId)
    throw new HttpsError("invalid-argument", "appointmentId required.");

  try {
    const appointmentRef = db.doc(
      `artifacts/${appId}/public/data/appointments/${appointmentId}`
    );
    const appointmentSnap = await appointmentRef.get();
    if (!appointmentSnap.exists)
      throw new HttpsError("not-found", "Appointment not found.");
    const appData = appointmentSnap.data();
    if (appData.userId !== uid)
      throw new HttpsError("permission-denied", "Not your appointment.");

    // Free slot
    const availSnap = await db
      .collection(`artifacts/${appId}/public/data/availability`)
      .where("date", "==", appData.date)
      .where("time", "==", appData.time)
      .get();
    if (!availSnap.empty)
      await availSnap.docs[0].ref.update({ isBooked: false, bookedBy: null });

    await appointmentRef.delete();

    // Clean up any pending test notification to prevent stale emails
    await db
      .doc(
        `artifacts/${appId}/public/data/pendingTestNotifications/${appointmentId}`
      )
      .delete()
      .catch(() => {});

    // Get user record for email
    const userRecord = await admin.auth().getUser(uid);

    // Send cancellation email with HTML template
    const dashboardUrl = `https://kentdiscountdrivingschool.com/dashboard.html`;
    const cancellationHtml = getAppointmentCancellationTemplate(
      userRecord.displayName || "Student",
      {
        date: appData.date,
        time: appData.time,
        sessionType: appData.sessionType,
      },
      dashboardUrl
    );

    await sendEmail(
      userRecord.email,
      `Appointment Cancelled: ${appData.sessionType}`,
      `Your appointment on ${appData.date} at ${appData.time} has been cancelled.`,
      cancellationHtml
    );

    return { success: true, message: "Appointment cancelled successfully." };
  } catch (err) {
    console.error(err);
    throw new HttpsError("internal", err.message);
  }
});

// Cancel (admin)
export const adminCancelAppointment = onCall(async (request) => {
  const { appointmentId } = request.data || {};
  const caller = request.auth?.token;
  if (!caller?.admin) throw new HttpsError("permission-denied", "Admin only.");
  if (!appointmentId)
    throw new HttpsError("invalid-argument", "appointmentId required.");

  try {
    const appointmentRef = db.doc(
      `artifacts/${appId}/public/data/appointments/${appointmentId}`
    );
    const appointmentSnap = await appointmentRef.get();
    if (!appointmentSnap.exists)
      throw new HttpsError("not-found", "Appointment not found.");

    const appData = appointmentSnap.data();

    // Handle external clients (admin-booked) where userId may be null
    let user = null;
    if (appData.userId) {
      try {
        user = await admin.auth().getUser(appData.userId);
      } catch (e) {
        console.warn(`Could not find user ${appData.userId}:`, e.message);
      }
    }

    const availSnap = await db
      .collection(`artifacts/${appId}/public/data/availability`)
      .where("date", "==", appData.date)
      .where("time", "==", appData.time)
      .get();
    if (!availSnap.empty)
      await availSnap.docs[0].ref.update({ isBooked: false, bookedBy: null });

    await appointmentRef.delete();

    // Clean up any pending test notification to prevent stale emails
    await db
      .doc(
        `artifacts/${appId}/public/data/pendingTestNotifications/${appointmentId}`
      )
      .delete()
      .catch(() => {});

    // Send cancellation email — only if we have a real user (skip for external/guest bookings)
    if (user && user.email) {
      const dashboardUrl = `https://kentdiscountdrivingschool.com/dashboard.html`;
      const cancellationHtml = getAppointmentCancellationTemplate(
        user.displayName || appData.studentName || "Student",
        {
          date: appData.date,
          time: appData.time,
          sessionType: appData.sessionType,
        },
        dashboardUrl
      );

      await sendEmail(
        user.email,
        `Appointment Cancelled by Admin: ${appData.sessionType}`,
        `Your appointment for ${appData.date} at ${appData.time} has been cancelled by admin.`,
        cancellationHtml
      );
    } else {
      console.log(
        `Appointment ${appointmentId} cancelled (external client — no email sent).`
      );
    }

    return { success: true, message: "Appointment cancelled by admin." };
  } catch (err) {
    console.error(err);
    throw new HttpsError("internal", err.message);
  }
});

/**
 * Admin: Book an appointment for a student (existing or external)
 */
export const adminBookAppointment = onCall(async (request) => {
  const {
    studentType,
    studentId,
    externalName,
    externalEmail,
    externalPhone,
    availabilityId,
    sessionType,
    instructorId,
  } = request.data || {};

  const caller = request.auth?.token;
  if (!caller?.admin) throw new HttpsError("permission-denied", "Admin only.");

  if (!availabilityId || !sessionType || !studentType) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  try {
    // Resolve student data BEFORE the transaction (reads that don't need atomicity)
    let targetName, targetEmail, targetPhone;

    if (studentType === "existing") {
      if (!studentId)
        throw new HttpsError(
          "invalid-argument",
          "studentId required for existing students."
        );
      const studentSnap = await db
        .doc(`artifacts/${appId}/public/data/students/${studentId}`)
        .get();
      if (!studentSnap.exists)
        throw new HttpsError("not-found", "Student profile not found.");
      const student = studentSnap.data();
      targetName = `${student.firstName} ${student.lastName}`;
      targetEmail = student.email;
      targetPhone = student.phoneNumber;
    } else {
      if (!externalName || !externalEmail)
        throw new HttpsError(
          "invalid-argument",
          "Name and email required for external clients."
        );
      targetName = externalName;
      targetEmail = externalEmail;
      targetPhone = externalPhone;
    }

    // ATOMIC LOCK & BOOKING TRANSACTION (prevents double-booking)
    const availRef = db.doc(
      `artifacts/${appId}/public/data/availability/${availabilityId}`
    );
    const apptRef = db
      .collection(`artifacts/${appId}/public/data/appointments`)
      .doc();

    const slot = await db.runTransaction(async (transaction) => {
      const availSnap = await transaction.get(availRef);
      if (!availSnap.exists)
        throw new HttpsError("not-found", "Slot not found.");
      const slotData = availSnap.data();
      if (slotData.isBooked)
        throw new HttpsError("failed-precondition", "Slot already booked.");

      // Lock the slot
      transaction.update(availRef, {
        isBooked: true,
        bookedBy: studentId || "EXTERNAL_CLIENT",
        instructorId: instructorId || null,
      });

      // Create appointment atomically
      transaction.set(apptRef, {
        userId: studentId || null,
        externalClient:
          studentType === "external"
            ? { name: targetName, email: targetEmail, phone: targetPhone }
            : null,
        date: slotData.date,
        time: slotData.time,
        sessionType,
        studentName: targetName,
        instructorId: instructorId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        bookedByAdmin: true,
      });

      return slotData;
    });

    // 5. Send Notifications
    const dashboardUrl = `https://kentdiscountdrivingschool.com/dashboard.html`;
    const confirmationHtml = getAppointmentConfirmationTemplate(
      targetName,
      {
        date: slot.date,
        time: slot.time,
        sessionType: sessionType,
        instructorName: instructorId ? "Assigned" : null,
      },
      dashboardUrl
    );

    await sendEmail(
      targetEmail,
      `Appointment Confirmed: ${sessionType}`,
      `Hello ${targetName}, your ${sessionType} at Kent Discount Driving School is confirmed for ${slot.date} at ${slot.time}.`,
      confirmationHtml
    );

    // Send admin notification
    const adminHtml = getAdminNotificationTemplate(targetName, targetEmail, {
      date: slot.date,
      time: slot.time,
      sessionType: sessionType,
      bookingType: "Admin Booking",
    });

    await sendEmail(
      "kentdiscountdriving@gmail.com",
      `New Booking: ${sessionType} - ${targetName}`,
      `New appointment booked for ${targetName} on ${slot.date} at ${slot.time}`,
      adminHtml
    );

    return {
      success: true,
      message: `Appointment booked for ${targetName}. Confirmation email sent.`,
      appointmentId: apptRef.id,
    };
  } catch (err) {
    console.error("adminBookAppointment error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message || "Unknown error");
  }
});

// ---------------------------------------------------------------------
// PAYMENT HANDLERS
// ---------------------------------------------------------------------

/**
 * Handle successful payment - send welcome email and enroll student
 * Called when user returns from Clover with successful payment
 */
export const handlePaymentSuccess = onCall(async (request) => {
  const { packageId, packageName, packagePrice } = request.data || {};
  const uid = request.auth?.uid;

  if (!uid) throw new HttpsError("unauthenticated", "Login required.");
  if (!packageId)
    throw new HttpsError("invalid-argument", "packageId required.");

  try {
    // 1. Get user data
    const userRecord = await admin.auth().getUser(uid);
    const studentRef = db.doc(`artifacts/${appId}/public/data/students/${uid}`);
    const studentSnap = await studentRef.get();
    const studentData = studentSnap.data() || {};

    const firstName =
      studentData.firstName ||
      splitName(userRecord.displayName).firstName ||
      "Student";

    // 2. Enroll student in package (pending_verification — admin must confirm in Clover)
    await studentRef.set(
      {
        enrolledPackage: {
          id: packageId,
          name: packageName,
          price: packagePrice,
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        paymentStatus: "pending_verification",
      },
      { merge: true }
    );

    console.log(`✅ Student ${uid} enrolled in ${packageName}`);

    // NOTE: Registration emails are now sent pre-payment
    // by the onStudentProfileCreated trigger.
    // No additional email is sent here as per user request.

    return {
      success: true,
      message: "Enrollment complete!",
    };
  } catch (err) {
    console.error("handlePaymentSuccess error:", err);
    throw new HttpsError("internal", err.message);
  }
});

/**
 * Handle failed payment - send admin notification
 * Called when payment fails or user abandons payment
 */
export const handlePaymentFailure = onCall(async (request) => {
  const { packageId, packageName, packagePrice } = request.data || {};
  const uid = request.auth?.uid;

  if (!uid) throw new HttpsError("unauthenticated", "Login required.");

  try {
    // 1. Get user data
    const userRecord = await admin.auth().getUser(uid);
    const studentRef = db.doc(`artifacts/${appId}/public/data/students/${uid}`);
    const studentSnap = await studentRef.get();
    const studentData = studentSnap.data() || {};

    const { firstName, lastName } = splitName(userRecord.displayName);

    // 2. Send admin notification email
    const notificationHtml = getPaymentFailureNotificationTemplate(
      {
        firstName: studentData.firstName || firstName || "Unknown",
        lastName: studentData.lastName || lastName || "",
        email: userRecord.email,
        phoneNumber: studentData.phoneNumber || "",
      },
      {
        packageName: packageName || "Unknown Package",
        packagePrice: packagePrice || 0,
      }
    );

    await sendEmail(
      "kentdiscountdriving@gmail.com",
      `âš ï¸ Payment Failed: ${studentData.firstName || firstName} ${studentData.lastName || lastName}`,
      `Payment failed for ${packageName}. Student: ${userRecord.email}`,
      notificationHtml
    );

    console.log(
      `ðŸ“§ Payment failure notification sent for ${userRecord.email}`
    );

    // 3. Mark payment as failed in student profile (optional tracking)
    await studentRef.set(
      {
        lastPaymentAttempt: {
          packageId: packageId,
          packageName: packageName,
          attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "failed",
        },
      },
      { merge: true }
    );

    return {
      success: true,
      message: "Admin notified of payment failure.",
    };
  } catch (err) {
    console.error("handlePaymentFailure error:", err);
    throw new HttpsError("internal", err.message);
  }
});

// ---------------------------------------------------------------------
// CONTACT FORM
// ---------------------------------------------------------------------

/**
 * Handle contact form submissions from the website
 * Sends the form contents to the company email
 */
export const submitContactForm = onCall(async (request) => {
  const { name, organization, email, phone, subject, message } =
    request.data || {};

  // Validate required fields
  if (!name || !email || !subject || !message) {
    throw new HttpsError(
      "invalid-argument",
      "Name, email, subject, and message are required."
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new HttpsError(
      "invalid-argument",
      "Please provide a valid email address."
    );
  }

  try {
    // Sanitize all user inputs before embedding in HTML
    const safeName = escapeHtml(name);
    const safeOrg = escapeHtml(organization);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const htmlMessage = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #14532d 0%, #052e16 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">New Contact Form Submission</h1>
          <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Received from the website contact page</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0; width: 140px; vertical-align: top;">Name</td>
              <td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">${safeName}</td>
            </tr>
            ${
              safeOrg
                ? `<tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0; vertical-align: top;">Organization</td>
              <td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">${safeOrg}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0; vertical-align: top;">Email</td>
              <td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${safeEmail}" style="color: #16a34a;">${safeEmail}</a></td>
            </tr>
            ${
              safePhone
                ? `<tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0; vertical-align: top;">Phone</td>
              <td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;"><a href="tel:${safePhone}" style="color: #16a34a;">${safePhone}</a></td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0; vertical-align: top;">Subject</td>
              <td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">${safeSubject}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #14532d; vertical-align: top;">Message</td>
              <td style="padding: 12px 16px; color: #334155; white-space: pre-wrap;">${safeMessage}</td>
            </tr>
          </table>
        </div>
        <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">Reply directly to this email to respond to the sender.</p>
        </div>
      </div>
    `;

    const plainText = `New Contact Form Submission\n\nName: ${name}\n${organization ? `Organization: ${organization}\n` : ""}Email: ${email}\n${phone ? `Phone: ${phone}\n` : ""}Subject: ${subject}\n\nMessage:\n${message}`;

    await sendEmail(
      "kentdiscountdriving@gmail.com",
      `Website Contact: ${safeSubject} — from ${safeName}`,
      plainText,
      htmlMessage
    );

    console.log(`📧 Contact form submission sent from ${email}`);

    return { success: true, message: "Contact form submitted successfully." };
  } catch (err) {
    console.error("submitContactForm error:", err);
    throw new HttpsError("internal", err.message);
  }
});

// ---------------------------------------------------------------------
// Password reset via SMTP2GO (avoids Firebase's noreply spam issues)
// ---------------------------------------------------------------------
export const sendPasswordReset = onCall(async (request) => {
  const { email } = request.data || {};
  if (!email) throw new HttpsError("invalid-argument", "Email is required.");

  try {
    // Generate an official Firebase password-reset link
    const resetUrl = await admin.auth().generatePasswordResetLink(email);

    // Look up the user's first name for the personalised greeting
    let firstName = "there";
    try {
      const user = await admin.auth().getUserByEmail(email);
      const parts = (user.displayName || "").trim().split(" ");
      if (parts[0]) firstName = parts[0];
    } catch (_) {
      // User not found or no display name â€” use generic greeting
    }

    // Build the branded HTML email (returns a raw HTML string)
    const htmlBody = getPasswordResetTemplate(firstName, resetUrl);
    const subject = "Reset Your Password â€” Discount Driving School";
    const plainText = `Hi ${firstName},\n\nWe received a request to reset your password.\n\nClick the link below to reset it (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nDiscount Driving School - Kent`;

    // Send via SMTP2GO through the Trigger Email Extension
    await sendEmail(email, subject, plainText, htmlBody);

    console.log(`âœ… Password reset email sent to ${email} via SMTP2GO`);
    return { success: true };
  } catch (err) {
    // If the email address isn't registered, don't reveal that fact
    if (err.code === "auth/user-not-found") {
      console.log(`â„¹ï¸ Password reset requested for unknown email: ${email}`);
      return { success: true }; // Silently succeed to prevent user enumeration
    }
    console.error("sendPasswordReset error:", err);
    throw new HttpsError(
      "internal",
      "Failed to send reset email. Please try again."
    );
  }
});

// ---------------------------------------------------------------------
// PAYMENT SELF-REPORT (Redirect Recovery)
// ---------------------------------------------------------------------
/**
 * reportPaymentCompleted â€” called by students whose Clover redirect failed.
 * Sets paymentStatus to 'self_reported_paid' so they aren't locked out,
 * and sends an admin notification to verify in Clover.
 */
export const reportPaymentStatus = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required.");

  try {
    const studentRef = db.doc(`artifacts/${appId}/public/data/students/${uid}`);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists)
      throw new HttpsError("not-found", "Student profile not found.");

    const studentData = studentSnap.data();
    const currentStatus = studentData.paymentStatus;

    if (
      currentStatus === "completed" ||
      currentStatus === "pending" ||
      currentStatus === "self_reported_paid"
    ) {
      return { success: true, message: "Payment already recorded." };
    }

    // Guard: prevent self-report if no package is enrolled
    if (!studentData.enrolledPackage) {
      throw new HttpsError(
        "failed-precondition",
        "No package enrolled. Please select a package first."
      );
    }

    await studentRef.update({
      paymentStatus: "pending",
      paymentSelfReportedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify admin to verify in Clover — all user data escaped to prevent XSS
    const firstName = escapeHtml(studentData.firstName || "Student");
    const lastName = escapeHtml(studentData.lastName || "");
    const packageName = escapeHtml(
      studentData.enrolledPackage?.name || "Unknown"
    );
    const safeEmail = escapeHtml(studentData.email || "N/A");
    const safePhone = escapeHtml(studentData.phoneNumber || "N/A");

    const adminHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Payment Self-Report</h1>
          <p style="color: #fef3c7; margin: 8px 0 0; font-size: 14px;">A student reports they have already paid via Clover</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 16px; margin-bottom: 16px;">The following student clicked "I Already Paid" on their dashboard. Their payment redirect may have failed. <strong>Please verify this payment in your Clover dashboard.</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0;">Name</td><td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0;">Email</td><td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">${safeEmail}</td></tr>
            <tr><td style="padding: 12px 16px; font-weight: 700; color: #14532d; border-bottom: 1px solid #e2e8f0;">Phone</td><td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">${safePhone}</td></tr>
            <tr><td style="padding: 12px 16px; font-weight: 700; color: #14532d;">Package</td><td style="padding: 12px 16px; color: #334155;">${packageName}</td></tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #fefce8; border-radius: 8px; border: 1px solid #fde68a;">
            <p style="color: #92400e; font-size: 14px; margin: 0;"><strong>Action Required:</strong> Verify this payment in Clover. If confirmed, use the Admin Dashboard Payment Tracking to finalize.</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(
      "kentdiscountdriving@gmail.com",
      `Payment Self-Report: ${firstName} ${lastName} - ${packageName}`,
      `${firstName} ${lastName} reports they have paid for ${packageName} via Clover, but the redirect failed. Please verify in Clover.`,
      adminHtml
    );

    console.log(
      `Payment self-report notification sent for ${studentData.email}`
    );
    return {
      success: true,
      message:
        "Your report has been received. Our team will verify your payment shortly.",
    };
  } catch (err) {
    console.error("reportPaymentCompleted error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message);
  }
});
