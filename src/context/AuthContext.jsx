import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, getRedirectResult } from "firebase/auth";
import { createUserIfNotExists } from "../firebase/db";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    // Handle redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await createUserIfNotExists(result.user);
          setUser(result.user);
          setLoading(false);
          clearTimeout(timeout);
        }
      })
      .catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await createUserIfNotExists(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const logout = () => signOut(auth);

  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#EEF2FF",
      flexDirection: "column", gap: "16px",
    }}>
      <div style={{ fontSize: "40px" }}>⏳</div>
      <p style={{ color: "#6366f1", fontWeight: "700", fontSize: "16px" }}>Loading...</p>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}