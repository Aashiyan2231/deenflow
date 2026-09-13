import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInAnonymously } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (mounted) {
          setUser({
            ...firebaseUser,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Student",
          });
          setAuthReady(true);
        }
        return;
      }

      try {
        await signInAnonymously(auth);
      } catch (error) {
        if (mounted) {
          setAuthError(error?.message || "Unable to authenticate with Firebase.");
          setAuthReady(true);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setUserName = (name) => {
    setUser((currentUser) => currentUser ? { ...currentUser, name, displayName: name } : currentUser);
  };

  const logout = () => {
    // Anonymous auth is restored automatically by the listener if signed out.
  };

  if (!authReady) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (authError) {
    return <div style={styles.error}>{authError}</div>;
  }

  return (
    <AuthContext.Provider value={{ user, logout, setUserName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

const styles = {
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0F0A1E",
    color: "#F0F4FF",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  error: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "#0F0A1E",
    color: "#ef4444",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textAlign: "center",
  },
};