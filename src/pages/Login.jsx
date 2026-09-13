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
      background: "#0F0A1E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background effects */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 60% 50% at 20% 20%, rgba(139,92,246,0.15) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 80% 80%, rgba(99,102,241,0.1) 0%, transparent 60%)
        `,
      }} />

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "32px",
        padding: "40px 32px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 24px 64px rgba(139,92,246,0.2)",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        backdropFilter: "blur(20px)",
      }}>

        {/* Logo */}
        <div style={{ fontSize: "52px", marginBottom: "8px" }}>⚔️</div>
        <h1 style={{
          fontSize: "32px", fontWeight: "800",
          background: "linear-gradient(135deg, #a78bfa, #818cf8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: "6px",
          letterSpacing: "-1px",
        }}>
          StudyBattle
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>
          Beat reel addiction. Win at studies. 🎮
        </p>
        <div style={{
          display: "inline-block",
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: "100px", padding: "4px 14px",
          color: "#a78bfa", fontSize: "11px", fontWeight: "700",
          marginBottom: "28px", letterSpacing: "1px",
        }}>
          🔥 JOIN THE GRIND
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
          {[
            { icon: "🏆", text: "Join study contests & compete" },
            { icon: "⭐", text: "Earn XP & level up daily" },
            { icon: "🔥", text: "Build streaks, beat friends" },
            { icon: "📚", text: "DSA, Maths, Physics & more" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: "12px", padding: "11px 14px",
              textAlign: "left",
            }}>
              <span style={{ fontSize: "18px" }}>{f.icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#c4b5fd" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Name Input */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: "#a78bfa", marginBottom: "10px", letterSpacing: "1px" }}>
          ENTER YOUR NAME TO BEGIN
        </p>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleStart()}
          placeholder="Your name..."
          style={{
            width: "100%", padding: "14px 16px",
            background: "rgba(255,255,255,0.05)",
            border: error ? "2px solid #ef4444" : "2px solid rgba(139,92,246,0.3)",
            borderRadius: "14px", color: "white",
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
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            border: "none", borderRadius: "14px", color: "white",
            fontSize: "15px", fontWeight: "700", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 8px 24px rgba(139,92,246,0.4)",
            marginBottom: "12px",
            transition: "all 0.2s",
          }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          ⚔️ Enter the Arena
        </button>

        <p style={{ color: "#4b5563", fontSize: "11px" }}>
          Free forever · No signup required
        </p>
      </div>
    </div>
  );
}

export default Login;