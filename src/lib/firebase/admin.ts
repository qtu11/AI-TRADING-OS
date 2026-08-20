import * as admin from "firebase-admin";

const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

export const isFirebaseAdminConfigured = Boolean(
  adminConfig.projectId && adminConfig.clientEmail && adminConfig.privateKey
);

if (!admin.apps.length && isFirebaseAdminConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: adminConfig.projectId,
        clientEmail: adminConfig.clientEmail,
        privateKey: adminConfig.privateKey,
      }),
    });
  } catch (error) {
    console.warn("Firebase Admin SDK initialization error:", error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;

export async function verifyServerSessionToken(token: string): Promise<string | null> {
  if (!token || !adminAuth) return null;
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
