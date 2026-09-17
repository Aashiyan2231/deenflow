import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

function friendCodeFromUid(uid) {
  return uid.slice(0, 8).toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Student";
      const sessionUser = { ...firebaseUser, uid: firebaseUser.uid, name, email: firebaseUser.email };
      setUser(sessionUser);
      setAuthReady(true);

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        name,
        displayName: name,
        email: firebaseUser.email || "",
        friendCode: friendCodeFromUid(firebaseUser.uid),
      }, { merge: true }).catch(() => {});
    });

    return unsubscribe;
  }, []);

  async function signUp(email, password, name) {
    setAuthError("");
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name?.trim()) await updateProfile(credential.user, { displayName: name.trim() });
  }

  async function signIn(email, password) {
    setAuthError("");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function logout() {
    await signOut(auth);
  }

  function setUserName(name) {
    setUser((currentUser) => currentUser ? { ...currentUser, name, displayName: name } : currentUser);
  }

  if (!authReady) return <div style={styles.loading}>Loading...</div>;
  if (authError) return <div style={styles.error}>{authError}</div>;

  return (
    <AuthContext.Provider value={{ user, logout, setUserName, signUp, signIn, authError, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

const styles = {
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0F0A1E", color: "#F0F4FF", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  error: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0F0A1E", color: "#ef4444", fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: "center" },
};
