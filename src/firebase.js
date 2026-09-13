import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBcWC_s3msiUe97eSJ8Oq3KJn1DKB0Zlng",
  authDomain: "sajdah-planner-d840b.firebaseapp.com",
  projectId: "sajdah-planner-d840b",
  storageBucket: "sajdah-planner-d840b.firebasestorage.app",
  messagingSenderId: "269604780518",
  appId: "1:269604780518:web:38704fd27ac70f7f233e27",
  measurementId: "G-H74TD0VCKE",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
