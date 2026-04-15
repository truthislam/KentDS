/**
 * Create Admin Account — One-time setup script
 * 
 * Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourSecurePassword node scripts/create-admin.cjs
 * 
 * NEVER hardcode credentials in source code.
 */
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

(async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ERROR: Must provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
    console.error("Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourSecurePass123! node scripts/create-admin.cjs");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ERROR: Password must be at least 8 characters.");
    process.exit(1);
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: "Admin",
    });

    console.log("Successfully created new user:", userRecord.uid);
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Successfully set admin: true custom claim for: ${email}`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      console.log("User already exists. Setting admin claim on existing user...");
      const userRecord = await auth.getUserByEmail(email);
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
      console.log(`Successfully set admin: true custom claim for: ${email}`);
    } else {
      console.error("Error:", err);
    }
  } finally {
    process.exit();
  }
})();
