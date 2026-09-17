import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = encoded
    ? Buffer.from(encoded, "base64").toString("utf8")
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64.");
  }

  return JSON.parse(raw);
}

if (!getApps().length) {
  const serviceAccount = loadServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
