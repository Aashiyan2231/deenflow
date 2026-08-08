import { signInWithRedirect } from "firebase/auth";
import { auth, provider } from "../firebase";

function Login() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080B14",
      color: "white",
      fontFamily: "'Space Grotesk', sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Background Effects */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(108,99,255,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(56,189,248,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 50% 10%, rgba(0,229,160,0.05) 0%, transparent 70%)
        `,
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />

      {/* Navbar */}
      <nav style={{
        position: "relative", zIndex: 1,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "20px", fontWeight: "900",
          background: "linear-gradient(135deg, #38bdf8, #7c3aed)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "2px",
        }}>
          ⚔️ DEENFLOW
        </div>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "10px 24px",
            background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.3)",
            borderRadius: "10px", color: "#38bdf8",
            fontFamily: "'Orbitron',monospace", fontSize: "11px",
            fontWeight: "700", cursor: "pointer", letterSpacing: "1px",
            transition: "all 0.2s",
          }}
        >
          SIGN IN
        </button>
      </nav>

      {/* Hero Section */}
      <div style={{
        position: "relative", zIndex: 1,
        textAlign: "center",
        padding: "80px 20px 60px",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)",
          borderRadius: "100px", padding: "6px 20px",
          fontFamily: "'Orbitron',monospace", fontSize: "10px",
          color: "#818cf8", letterSpacing: "3px", marginBottom: "24px",
        }}>
          ◆ BUILD DISCIPLINE LIKE A GAME
        </div>

        {/* Main Title */}
        <h1 style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "clamp(36px, 8vw, 80px)",
          fontWeight: "900",
          background: "linear-gradient(135deg, #fff 0%, #38bdf8 40%, #7c3aed 70%, #00e5a0 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: "1.05",
          letterSpacing: "3px",
          marginBottom: "24px",
        }}>
          WELCOME TO<br />DEENFLOW
        </h1>

        {/* Subtitle */}
        <p style={{
          color: "#94a3b8", fontSize: "18px",
          maxWidth: "600px", margin: "0 auto 16px",
          lineHeight: "1.6",
        }}>
          A gamified self-improvement platform built on
          <span style={{ color: "#00e5a0" }}> Deen</span>,
          <span style={{ color: "#818cf8" }}> Duniya</span> &
          <span style={{ color: "#f87171" }}> Health</span>.
          Complete daily missions, earn XP, and compete with friends.
        </p>

        <p style={{
          fontFamily: "'Orbitron',monospace",
          color: "#64748b", fontSize: "12px",
          letterSpacing: "2px", marginBottom: "40px",
        }}>
          DEEN · DUNIYA · HEALTH — YOUR TRANSFORMATION BEGINS
        </p>

        {/* CTA Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "18px 48px",
            background: "linear-gradient(135deg, rgba(108,99,255,0.4), rgba(56,189,248,0.3))",
            border: "1px solid rgba(108,99,255,0.5)",
            borderRadius: "16px", color: "white",
            fontFamily: "'Orbitron',monospace", fontSize: "14px",
            fontWeight: "700", cursor: "pointer", letterSpacing: "2px",
            transition: "all 0.3s",
            boxShadow: "0 0 40px rgba(108,99,255,0.2)",
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = "0 0 60px rgba(108,99,255,0.4)"}
          onMouseOut={e => e.currentTarget.style.boxShadow = "0 0 40px rgba(108,99,255,0.2)"}
        >
          🚀 GET STARTED — SIGN IN WITH GOOGLE
        </button>

        <p style={{ color: "#64748b", fontSize: "12px", marginTop: "16px" }}>
          Free forever · No credit card required
        </p>
      </div>

      {/* Features Grid */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: "1000px", margin: "0 auto",
        padding: "0 20px 40px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
      }}>
        {[
          {
            icon: "⚔️",
            title: "DAILY MISSIONS",
            desc: "Complete Deen, Duniya & Health missions every day. Earn XP and level up.",
            color: "#00e5a0",
            glow: "rgba(0,229,160,0.1)",
            border: "rgba(0,229,160,0.2)",
          },
          {
            icon: "👥",
            title: "GROUP CHALLENGES",
            desc: "Create or join groups. Admin sets missions. Compete with your circle for 30 days.",
            color: "#818cf8",
            glow: "rgba(129,140,248,0.1)",
            border: "rgba(129,140,248,0.2)",
          },
          {
            icon: "🏆",
            title: "LEADERBOARD",
            desc: "See how you rank against friends and group members. Stay motivated.",
            color: "#fbbf24",
            glow: "rgba(251,191,36,0.1)",
            border: "rgba(251,191,36,0.2)",
          },
          {
            icon: "📈",
            title: "LEVEL SYSTEM",
            desc: "Earn XP, level up from Initiate to Legend. Track your growth over time.",
            color: "#38bdf8",
            glow: "rgba(56,189,248,0.1)",
            border: "rgba(56,189,248,0.2)",
          },
          {
            icon: "🔥",
            title: "STREAK TRACKING",
            desc: "Keep your daily streak alive. Consistency is the key to transformation.",
            color: "#f87171",
            glow: "rgba(248,113,113,0.1)",
            border: "rgba(248,113,113,0.2)",
          },
          {
            icon: "🤝",
            title: "FRIEND SYSTEM",
            desc: "Add friends with unique codes. Challenge them and grow together.",
            color: "#7c3aed",
            glow: "rgba(124,58,237,0.1)",
            border: "rgba(124,58,237,0.2)",
          },
        ].map((f, i) => (
          <div key={i} style={{
            background: f.glow,
            border: `1px solid ${f.border}`,
            borderRadius: "20px", padding: "24px",
            transition: "transform 0.2s",
          }}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{f.icon}</div>
            <div style={{
              fontFamily: "'Orbitron',monospace", fontSize: "12px",
              color: f.color, fontWeight: "700", letterSpacing: "1px",
              marginBottom: "8px",
            }}>
              {f.title}
            </div>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "40px 20px 60px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: "clamp(20px, 4vw, 36px)",
          fontWeight: "900", color: "white",
          marginBottom: "16px",
        }}>
          READY TO LEVEL UP?
        </div>
        <p style={{ color: "#64748b", marginBottom: "28px", fontSize: "15px" }}>
          Join hundreds of people building better habits every day.
        </p>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "16px 40px",
            background: "linear-gradient(135deg, rgba(0,229,160,0.2), rgba(56,189,248,0.15))",
            border: "1px solid rgba(0,229,160,0.4)",
            borderRadius: "14px", color: "#00e5a0",
            fontFamily: "'Orbitron',monospace", fontSize: "13px",
            fontWeight: "700", cursor: "pointer", letterSpacing: "2px",
          }}
        >
          START YOUR JOURNEY →
        </button>

        <div style={{
          marginTop: "40px",
          fontFamily: "'Orbitron',monospace",
          fontSize: "10px", color: "#334155",
          letterSpacing: "2px",
        }}>
          DEENFLOW © 2025 · BUILD WITH PURPOSE
        </div>
      </div>

    </div>
  );
}

export default Login;