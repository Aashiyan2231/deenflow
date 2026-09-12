import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user already set their name
    const savedUser = localStorage.getItem("deenflow_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const setUserName = (name) => {
    const userData = {
      uid: `user_${Date.now()}`,
      displayName: name,
      photoURL: null,
    };
    localStorage.setItem("deenflow_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("deenflow_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout, setUserName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}