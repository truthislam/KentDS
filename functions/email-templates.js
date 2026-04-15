/**
 * Professional Email Templates for Discount Driving School
 * Uses Firebase Trigger Email Extension with SMTP2GO
 * 
 * Features:
 * - Professional HTML styling with responsive design
 * - 5-star rating banner
 * - Navigation links (Homepage, Student Portal, Blog)
 * - Branded header and footer
 * - Mobile-friendly layout
 */

// Base URL - Update with your production domain
const BASE_URL = process.env.BASE_URL || 'https://kentdiscountdrivingschool.com';

// Contact Information
const SCHOOL_NAME = 'Discount Driving School - Kent';
const SCHOOL_PHONE = '(206) 551-9748';
const SCHOOL_EMAIL = 'kentdiscountdriving@gmail.com';
const SCHOOL_ADDRESS = '23231 Pacific Hwy S, Kent, WA 98032';

/**
 * Base HTML Email Template
 * Provides consistent styling and structure for all emails
 */
function getBaseTemplate(content, preheader = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SCHOOL_NAME}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #14532d; line-height: 1.5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .section { padding: 32px; }
    .header-banner { padding: 24px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px; }
    .bg-blue { background-color: #16a34a; }
    .bg-green { background-color: #16a34a; }
    .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; margin-bottom: 8px; font-size: 15px; }
    .detail-label { width: 100px; font-weight: 600; color: #475569; }
    .detail-value { flex: 1; color: #14532d; }
    .schedule-box { background-color: #eef2ff; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; }
    .footer { text-align: center; padding: 24px; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; background-color: #ffffff; }
    .footer a { color: #16a34a; text-decoration: none; }
    h1, h2, h3 { margin: 0 0 16px; color: #052e16; }
    p { margin: 0 0 16px; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    ${content}
    <div class="footer">
      <p style="font-weight: 600; margin-bottom: 8px;">${SCHOOL_NAME}</p>
      <p style="margin-bottom: 4px;">📍 ${SCHOOL_ADDRESS}</p>
      <p>📞 <a href="tel:${SCHOOL_PHONE}">${SCHOOL_PHONE}</a> | ✉️ <a href="mailto:${SCHOOL_EMAIL}">${SCHOOL_EMAIL}</a></p>
      <p style="margin-top: 16px; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} All rights reserved. Professional driving instruction you can trust.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Welcome Email Template
 * Sent to new students after account creation
 */
export function getWelcomeEmailTemplate(studentName, dashboardUrl, loginUrl) {
  const content = `
    <h2>Welcome to Discount Driving School, ${studentName}! 🎉</h2>
    
    <p>We're thrilled to have you join our community of confident, safe drivers!</p>
    
    <p>Your account has been successfully created, and we're excited to help you on your journey to getting your driver's license!</p>
    
    <div class="info-box">
      <h3>What Happens Next?</h3>
      <p><strong>📋 Lesson Organization:</strong> Our admins will organize your lessons and contact you soon with your schedule</p>
      <p><strong>📚 Class Instruction First:</strong> You'll need to complete 2 weeks of class instruction before scheduling practice drives</p>
      <p><strong>🚗 Practice Drives:</strong> Once you've completed your classroom hours, you can schedule practice drives through your student portal</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="cta-button">Access Your Student Portal</a>
    </p>
    
    <p><strong>Why Choose Us?</strong></p>
    <ul style="color: #57534e; font-size: 16px; line-height: 1.8;">
      <li>🏆 5-star rated driving school</li>
      <li>✅ State-approved DOL testing center</li>
      <li>👨‍🏫 Expert certified instructors</li>
      <li>📅 Flexible online scheduling</li>
      <li>💰 Affordable, transparent pricing</li>
    </ul>
    
    <p>If you have any questions, don't hesitate to reach out. We're here to help you succeed!</p>
      
      <p style="margin-top: 16px;">
        Best regards,<br>
        <strong>Team Discount Driving School</strong>
      </p>
    </div>
  `;

  const preheader = 'Welcome to Discount Driving School! Your account is ready.';

  return getBaseTemplate(content, preheader);
}

/**
 * Appointment Confirmation Template
 */
export function getAppointmentConfirmationTemplate(studentName, appointmentDetails, dashboardUrl) {
  const { date, time, sessionType, instructorName } = appointmentDetails;

  const content = `
    <div class="section">
      <p class="greeting">Appointment Confirmed! ✅</p>
      
      <p>Hello ${studentName},</p>
      
      <p>Your appointment at <strong>Discount Driving School - Kent</strong> has been successfully confirmed.</p>
    </div>
    
    <div class="section">
      <div class="info-box">
        <h3 style="margin: 0 0 12px; color: #1e40af;">Appointment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600; width: 40%;">Session Type:</td>
            <td style="padding: 8px 0;"><strong>${sessionType}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Date:</td>
            <td style="padding: 8px 0;"><strong>${date}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Time:</td>
            <td style="padding: 8px 0;"><strong>${time}</strong></td>
          </tr>
        </table>
      </div >
    </div >
    
    <div class="section" style="background-color: #f9fafb;">
      <h3 style="color: #1e40af; margin: 0 0 12px;">Important Reminders</h3>
      <ul style="line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Arrive <strong>10 minutes early</strong> to complete any necessary paperwork</li>
        <li>Bring a <strong>valid ID</strong> and any required documents</li>
        <li>Wear <strong>comfortable clothing and shoes</strong></li>
        <li>Contact us if you need to reschedule or cancel</li>
      </ul>
    </div>
    
    <div class="section">
      <p style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View in Dashboard →</a>
      </p>
      
      <div class="info-box">
        <p style="margin: 0; font-weight: 600; color: #1e40af;">📍 Location</p>
        <p style="margin: 8px 0 0;">${SCHOOL_ADDRESS}</p>
      </div>
      
      <div class="info-box" style="margin-top: 12px;">
        <p style="margin: 0; font-weight: 600; color: #1e40af;">📞 Questions or Need to Reschedule?</p>
        <p style="margin: 8px 0 0;">
          Call us at <a href="tel:${SCHOOL_PHONE}" style="color: #16a34a; text-decoration: none;">${SCHOOL_PHONE}</a>
        </p>
      </div>
    </div>
`;

  const preheader = `Your ${sessionType} appointment is confirmed for ${date} at ${time} `;

  return getBaseTemplate(content, preheader);
}

/**
 * Appointment Cancellation Template
 */
export function getAppointmentCancellationTemplate(studentName, appointmentDetails, dashboardUrl) {
  const { date, time, sessionType } = appointmentDetails;

  const content = `
  < div class="section" >
      <p class="greeting">Appointment Cancelled</p>
      
      <p>Hello ${studentName},</p>
      
      <p>Your appointment at Discount Driving School has been cancelled as requested.</p>
    </div >
    
    <div class="section">
      <div class="info-box">
        <h3 style="margin: 0 0 12px; color: #1e40af;">Cancelled Appointment</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600; width: 40%;">Session Type:</td>
            <td style="padding: 8px 0;">${sessionType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Date:</td>
            <td style="padding: 8px 0;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Time:</td>
            <td style="padding: 8px 0;">${time}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="section" style="background-color: #fef3c7; text-align: center;">
      <h3 style="color: #92400e; margin: 0 0 12px;">Ready to Book Again?</h3>
      <p style="margin: 0 0 16px;">We're here when you're ready to schedule your next session!</p>
      <a href="${dashboardUrl}" class="cta-button">Book New Appointment →</a>
    </div>
    
    <div class="section">
      <div class="info-box">
        <p style="margin: 0; font-weight: 600; color: #1e40af;">📞 Need Assistance?</p>
        <p style="margin: 8px 0 0;">
          Call us at <a href="tel:${SCHOOL_PHONE}" style="color: #16a34a; text-decoration: none;">${SCHOOL_PHONE}</a> or 
          email <a href="mailto:${SCHOOL_EMAIL}" style="color: #16a34a; text-decoration: none;">${SCHOOL_EMAIL}</a>
        </p>
      </div>
    </div>
`;

  const preheader = `Your ${sessionType} appointment on ${date} has been cancelled`;

  return getBaseTemplate(content, preheader);
}

/**
 * Admin Notification Template
 * For new bookings, student registrations, etc.
 */
export function getAdminNotificationTemplate(studentName, studentEmail, appointmentDetails) {
  const { date, time, sessionType, bookingType } = appointmentDetails;

  const content = `
  < div class="section" >
      <h2 style="color: #1e40af; margin: 0 0 12px;">📅 ${bookingType || 'New Booking'}</h2>
      <p style="font-size: 14px; color: #57534e; margin: 0;">Admin Notification</p>
    </div >
    
    <div class="section">
      <div class="info-box">
        <h3 style="margin: 0 0 12px; color: #1e40af;">Student Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600; width: 30%;">Name:</td>
            <td style="padding: 8px 0;"><strong>${studentName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${studentEmail}" style="color: #16a34a;">${studentEmail}</a></td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="section">
      <div class="info-box">
        <h3 style="margin: 0 0 12px; color: #1e40af;">Appointment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600; width: 30%;">Session Type:</td>
            <td style="padding: 8px 0;"><strong>${sessionType}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Date:</td>
            <td style="padding: 8px 0;"><strong>${date}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Time:</td>
            <td style="padding: 8px 0;"><strong>${time}</strong></td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="section" style="text-align: center; background-color: #f9fafb;">
      <p style="margin: 0 0 16px; color: #57534e; font-size: 13px;">
        This is an automated notification from your booking system.
      </p>
      <a href="${BASE_URL}/admin.html" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">Open Admin Dashboard →</a>
    </div>
`;

  const preheader = `New booking: ${studentName} - ${sessionType} `;

  return getBaseTemplate(content, preheader);
}

/**
 * Password Reset Template
 */
export function getPasswordResetTemplate(firstName, resetUrl) {
  const content = `
    <div class="section">
      <h2>Reset Your Password 🔐</h2>
    
    <p>Hi ${firstName},</p>
    
    <p>We received a request to reset your password for your Discount Driving School account.</p>
    
    <p style="text-align: center;">
      <a href="${resetUrl}" class="cta-button">Reset My Password</a>
    </p>
    
    <p>This link will expire in 1 hour for security reasons.</p>
    
    <p><strong>Didn't request a password reset?</strong><br>
    You can safely ignore this email. Your password will not be changed.</p>
    
    <p>If you have any concerns about your account security, please contact us immediately.</p>
`;

  const preheader = 'Reset your Discount Driving School password';

  return getBaseTemplate(content, preheader);
}

/**
 * New Student Registration - Company Notification
 * Sent to company email when a new student successfully registers
 */
export function getNewStudentNotificationTemplate(studentData, packageData) {
  const { firstName, lastName, email, phoneNumber } = studentData;
  const { packageName, packagePrice, sessionType, teenSession } = packageData;

  const teenSessionHtml = teenSession ? `
      <h3 style="margin-top: 24px;">Selected Course Session</h3>
      <div class="details-box" style="background-color: #eef2ff; border-left: 4px solid #4f46e5;">
        <div class="detail-row"><div class="detail-label">Type:</div><div class="detail-value"><strong>${teenSession.type || 'N/A'}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Dates:</div><div class="detail-value">${teenSession.startDate || ''} to ${teenSession.endDate || ''}</div></div>
        <div class="detail-row"><div class="detail-label">Schedule:</div><div class="detail-value">${teenSession.scheduleDisplay || 'N/A'}</div></div>
      </div>` : '';

  const content = `
    <div class="header-banner bg-blue">New Booking Received</div>
    <div class="section">
      <h3>Customer Details</h3>
      <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value">${firstName} ${lastName}</div></div>
      <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${email}</div></div>
      <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${phoneNumber || 'N/A'}</div></div>

      <h3 style="margin-top: 24px;">Booking Details</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Type:</div><div class="detail-value">${sessionType || 'Course Enrollment'}</div></div>
        <div class="detail-row"><div class="detail-label">Package:</div><div class="detail-value">${packageName}</div></div>
        <div class="detail-row"><div class="detail-label">Price:</div><div class="detail-value">$${packagePrice}</div></div>
      </div>
      ${teenSessionHtml}
      
      <div class="schedule-box">
        <p style="margin-bottom: 8px; font-weight: 600; color: #4338ca;">Class Schedule:</p>
        <p style="margin: 0; font-size: 14px; color: #1e1b4b;">${teenSession ? 'Student selected the session above. Please confirm their enrollment.' : 'Admins will review this booking and contact the student to finalize the schedule.'}</p>
      </div>
    </div>
`;

  return getBaseTemplate(content, `New booking: ${firstName} ${lastName}`);
}

/**
 * Student Registration Confirmation
 * Sent to the student immediately after registration
 */
export function getStudentRegistrationConfirmationTemplate(studentData, packageData) {
  const { firstName, lastName } = studentData;
  const { packageName, packagePrice, sessionType, teenSession } = packageData;

  const teenSessionHtml = teenSession ? `
      <h3 style="margin-top: 24px;">Your Course Session</h3>
      <div class="details-box" style="background-color: #eef2ff; border-left: 4px solid #4f46e5;">
        <div class="detail-row"><div class="detail-label">Type:</div><div class="detail-value"><strong>${teenSession.type || 'N/A'} Course</strong></div></div>
        <div class="detail-row"><div class="detail-label">Dates:</div><div class="detail-value">${teenSession.startDate || ''} to ${teenSession.endDate || ''}</div></div>
        <div class="detail-row"><div class="detail-label">Schedule:</div><div class="detail-value">${teenSession.scheduleDisplay || 'N/A'}</div></div>
        <div class="detail-row"><div class="detail-label">Total Hours:</div><div class="detail-value">30 hours (state-certified)</div></div>
      </div>` : '';

  const content = `
    <div class="header-banner bg-green">Booking Confirmed</div>
    <div class="section">
      <p>Dear ${firstName} ${lastName},</p>
      <p>Thank you for choosing <strong>${SCHOOL_NAME}</strong>. Your booking has been successfully received and confirmed.</p>
      
      <h3>Booking Details</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Type:</div><div class="detail-value">${sessionType || 'Course Enrollment'}</div></div>
        <div class="detail-row"><div class="detail-label">Package:</div><div class="detail-value">${packageName}</div></div>
        <div class="detail-row"><div class="detail-label">Price:</div><div class="detail-value">$${packagePrice}</div></div>
      </div>
      ${teenSessionHtml}

      <div class="schedule-box">
        <p style="margin-bottom: 8px; font-weight: 600; color: #166534;">Next Steps:</p>
        <p style="margin: 0; font-size: 14px;">${teenSession ? 'Your session is confirmed. Please complete payment to secure your spot. Our team will send you a reminder before your first class.' : 'Our team will contact you shortly with your full schedule and next steps.'}</p>
      </div>

      <p style="margin-top: 24px; font-size: 14px; color: #64748b;">If you have any questions, please reply to this email or call us.</p>
    </div>
`;

  return getBaseTemplate(content, `Booking Confirmed: ${packageName}`);
}

/**
 * Failed Payment - Admin Notification
 * Sent to admin when a student creates account but payment fails
 */
export function getPaymentFailureNotificationTemplate(studentData, packageData) {
  const { firstName, lastName, email, phoneNumber } = studentData;
  const { packageName, packagePrice } = packageData;
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const content = `
  < div class="section" >
      <h1 style="color: #dc2626; font-size: 24px; margin: 0 0 16px;">⚠️ Payment Failed</h1>
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        A potential student created an account but their payment did not go through.
      </p>
    </div >

    <div class="section">
      <div class="info-box">
        <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 12px;">Student Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600; width: 30%;">Name:</td>
            <td style="padding: 8px 0;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></td>
          </tr>
          ${phoneNumber ? `
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Phone:</td>
            <td style="padding: 8px 0;"><a href="tel:${phoneNumber}" style="color: #16a34a;">${phoneNumber}</a></td>
          </tr>
          ` : ''}
        </table>
      </div>
    </div>

    <div class="section">
      <div class="info-box">
        <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 12px;">Package Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600; width: 30%;">Package:</td>
            <td style="padding: 8px 0;">${packageName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Price:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #1e40af;">$${packagePrice}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #57534e; font-weight: 600;">Timestamp:</td>
            <td style="padding: 8px 0;">${timestamp}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="cta-box">
        <h3 style="margin: 0 0 12px; color: #1e40af;">Recommended Actions</h3>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.8; text-align: left;">
          <li><strong>Contact within 24 hours</strong> - Call ${phoneNumber ? phoneNumber : `or email ${email}`}</li>
          <li><strong>Ask about payment issue</strong> - They may need help or have questions</li>
          <li><strong>Offer alternatives</strong> - Different payment method or in-person payment</li>
          <li><strong>Follow up</strong> - If no response, send a reminder email after 2-3 days</li>
        </ol>
      </div>
    </div>

    <div class="section" style="text-align: center; padding-top: 20px; border-top: 1px solid #e7e5e4;">
      <p style="color: #78716c; font-size: 13px; margin: 0;">
        This is an automated notification from your booking system. Do not reply to this email.
      </p>
    </div>
`;

  const preheader = 'Failed payment attempt - follow up needed';

  return getBaseTemplate(content, preheader);
}

/**
 * Test Registration Received — Client Email (Pre-Payment, ~7 min delay)
 * Sent if the client has NOT completed payment after the delay window.
 */
export function getTestRegistrationReceivedTemplate(studentData, appointmentDetails) {
  const { firstName, lastName } = studentData;
  const { date, time, sessionType, testName } = appointmentDetails;
  const displayName = testName || sessionType;

  const content = `
    <div class="header-banner" style="background-color: #a16207; padding: 24px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px;">Registration Received 📋</div>
    <div class="section">
      <p>Dear ${firstName} ${lastName},</p>
      <p>Thank you for registering with <strong>${SCHOOL_NAME}</strong>. We have received your information for the following test:</p>

      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Test:</div><div class="detail-value"><strong>${displayName}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Date:</div><div class="detail-value">${date}</div></div>
        <div class="detail-row"><div class="detail-label">Time:</div><div class="detail-value">${time}</div></div>
      </div>

      <div style="background-color: #fefce8; border-left: 4px solid #a16207; padding: 16px; border-radius: 4px; margin-top: 16px;">
        <p style="margin-bottom: 8px; font-weight: 600; color: #92400e;">⏳ Payment Not Yet Confirmed</p>
        <p style="margin: 0; font-size: 14px; color: #78350f;">
          It looks like your payment may not have been completed. Your slot is reserved, but
          <strong>your booking will only be fully confirmed once payment is received.</strong>
        </p>
      </div>

      <p style="margin-top: 24px;">To complete your booking, please return to our website and proceed with payment. If you need help, call us at <a href="tel:${SCHOOL_PHONE}" style="color: #16a34a;">${SCHOOL_PHONE}</a>.</p>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        Best regards,<br>
        <strong>Team ${SCHOOL_NAME}</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, `We received your ${displayName} registration — payment pending`);
}

/**
 * Test Pending Payment — Admin Notification (~7 min delay, no-pay case)
 * Sent to company when a client registered for a test but did NOT complete payment.
 */
export function getTestPendingPaymentAdminTemplate(studentData, appointmentDetails) {
  const { firstName, lastName, email, phoneNumber } = studentData;
  const { date, time, sessionType, testName } = appointmentDetails;
  const displayName = testName || sessionType;
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const content = `
    <div class="header-banner" style="background-color: #b45309; padding: 24px; text-align: center; color: #ffffff; font-weight: bold; font-size: 24px;">⚠️ Registered — Payment Pending</div>
    <div class="section">
      <p style="font-size: 15px; color: #57534e;">A student registered for a test but <strong>has not completed payment</strong> as of ${timestamp}.</p>

      <h3>Student Information</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value"><strong>${firstName} ${lastName}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></div></div>
        <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${phoneNumber ? `<a href="tel:${phoneNumber}" style="color: #16a34a;">${phoneNumber}</a>` : 'Not provided'}</div></div>
      </div>

      <h3 style="margin-top: 24px;">Test Details</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Test:</div><div class="detail-value"><strong>${displayName}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Date:</div><div class="detail-value">${date}</div></div>
        <div class="detail-row"><div class="detail-label">Time:</div><div class="detail-value">${time}</div></div>
        <div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value" style="color: #b45309; font-weight: 600;">Payment Not Received</div></div>
      </div>

      <div class="schedule-box" style="margin-top: 16px;">
        <p style="margin-bottom: 8px; font-weight: 600; color: #4338ca;">Recommended Follow-Up</p>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px; color: #1e1b4b;">
          <li>Call ${phoneNumber ? `<a href="tel:${phoneNumber}" style="color:#16a34a;">${phoneNumber}</a>` : `or email <a href="mailto:${email}" style="color:#16a34a;">${email}</a>`} within 1–2 hours</li>
          <li>Ask if they had trouble with payment</li>
          <li>Offer to assist or take in-person payment</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${BASE_URL}/admin.html" style="display: inline-block; background-color: #b45309; color: #ffffff; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">Open Admin Dashboard →</a>
      </div>

      <p style="font-size: 13px; color: #78716c; margin-top: 24px; text-align: center;">
        Automated notification — the slot is still reserved for this student.
      </p>
    </div>
  `;

  return getBaseTemplate(content, `Follow-up needed: ${firstName} ${lastName} — ${displayName} payment pending`);
}

/**
 * Test Booking Confirmed + Paid — Client Email (Immediate, after Clover payment)
 */
export function getTestBookingConfirmedTemplate(studentData, appointmentDetails) {
  const { firstName, lastName } = studentData;
  const { date, time, sessionType, testName, price } = appointmentDetails;
  const displayName = testName || sessionType;

  const content = `
    <div class="header-banner bg-green">Booking Confirmed ✅</div>
    <div class="section">
      <p>Dear ${firstName} ${lastName},</p>
      <p>Your payment has been received and your <strong>${displayName}</strong> appointment is officially confirmed!</p>

      <h3>Appointment Details</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Test:</div><div class="detail-value"><strong>${displayName}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Date:</div><div class="detail-value">${date}</div></div>
        <div class="detail-row"><div class="detail-label">Time:</div><div class="detail-value">${time}</div></div>
        ${price ? `<div class="detail-row"><div class="detail-label">Price Paid:</div><div class="detail-value" style="color: #16a34a; font-weight: 600;">$${price}</div></div>` : ''}
        <div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value" style="color: #16a34a; font-weight: 600;">✅ Confirmed &amp; Paid</div></div>
      </div>

      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin-top: 16px;">
        <p style="margin-bottom: 8px; font-weight: 600; color: #166534;">Important Reminders</p>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px; color: #14532d;">
          <li>Arrive <strong>10 minutes early</strong> to complete paperwork</li>
          <li>Bring a <strong>valid photo ID</strong></li>
          <li>Call us to reschedule: <a href="tel:${SCHOOL_PHONE}" style="color: #16a34a;">${SCHOOL_PHONE}</a></li>
        </ul>
      </div>

      <p style="margin-top: 20px;">📍 <strong>Location:</strong> ${SCHOOL_ADDRESS}</p>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        Best regards,<br>
        <strong>Team ${SCHOOL_NAME}</strong>
      </p>
    </div>
  `;

  return getBaseTemplate(content, `${displayName} confirmed for ${date} at ${time}`);
}

/**
 * Test Booking Paid — Admin Notification (Immediate, after Clover payment)
 */
export function getTestBookingPaidAdminTemplate(studentData, appointmentDetails) {
  const { firstName, lastName, email, phoneNumber } = studentData;
  const { date, time, sessionType, testName, price } = appointmentDetails;
  const displayName = testName || sessionType;
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const content = `
    <div class="header-banner bg-green">✅ Test Booking Paid</div>
    <div class="section">
      <p style="font-size: 15px; color: #57534e;">A student completed payment for a test booking as of ${timestamp}.</p>

      <h3>Student Information</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value"><strong>${firstName} ${lastName}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></div></div>
        <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${phoneNumber ? `<a href="tel:${phoneNumber}" style="color: #16a34a;">${phoneNumber}</a>` : 'Not provided'}</div></div>
      </div>

      <h3 style="margin-top: 24px;">Test &amp; Payment Details</h3>
      <div class="details-box">
        <div class="detail-row"><div class="detail-label">Test:</div><div class="detail-value"><strong>${displayName}</strong></div></div>
        <div class="detail-row"><div class="detail-label">Date:</div><div class="detail-value">${date}</div></div>
        <div class="detail-row"><div class="detail-label">Time:</div><div class="detail-value">${time}</div></div>
        ${price ? `<div class="detail-row"><div class="detail-label">Amount Paid:</div><div class="detail-value" style="color: #16a34a; font-weight: 600;">$${price}</div></div>` : ''}
        <div class="detail-row"><div class="detail-label">Payment Status:</div><div class="detail-value" style="color: #16a34a; font-weight: 600;">✅ Completed</div></div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${BASE_URL}/admin.html" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">Open Admin Dashboard →</a>
      </div>

      <p style="font-size: 13px; color: #78716c; margin-top: 24px; text-align: center;">
        Automated notification from your booking system.
      </p>
    </div>
  `;

  return getBaseTemplate(content, `Test booking paid: ${firstName} ${lastName} — ${displayName}`);
}
