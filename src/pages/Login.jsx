import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { setUserName } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    if (!name.trim()) {
      setError("Please enter your name!");
      return;
    }
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters!");
      return;
    }
    setUserName(name.trim());
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: "white",
        borderRadius: "32px",
        padding: "40px 32px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚔️</div>
        <h1 style={{
          fontSize: "28px", fontWeight: "800",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: "6px",
        }}>
          DeenFlow
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "32px" }}>
          Build discipline like a game 🎮
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
          {[
            { icon: "⚔️", text: "Complete daily missions" },
            { icon: "⭐", text: "Earn XP & level up" },
            { icon: "🏆", text: "Compete on leaderboard" },
            { icon: "👥", text: "Join group challenges" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "#f8fafc", borderRadius: "12px", padding: "12px 16px",
              textAlign: "left",
            }}>
              <span style={{ fontSize: "20px" }}>{f.icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e1b4b" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Name Input */}
        <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e1b4b", marginBottom: "10px" }}>
          Enter your name to get started
        </p>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleStart()}
          placeholder="Your name..."
          style={{
            width: "100%", padding: "14px 16px",
            background: "#f8fafc", border: error ? "2px solid #ef4444" : "2px solid #e2e8f0",
            borderRadius: "14px", color: "#1e1b4b",
            fontSize: "15px", fontWeight: "600",
            outline: "none", boxSizing: "border-box",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: "8px", textAlign: "center",
          }}
        />
        {error && (
          <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "8px" }}>{error}</p>
        )}

        <button
          onClick={handleStart}
          style={{
            width: "100%", padding: "15px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: "14px", color: "white",
            fontSize: "15px", fontWeight: "700", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
            marginBottom: "12px",
          }}
        >
          🚀 Start My Journey
        </button>

        <p style={{ color: "#94a3b8", fontSize: "11px" }}>
          Free forever · No signup required
        </p>
      </div>
    </div>
  );
}

export default Login;