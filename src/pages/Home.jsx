import { useUser } from "../hooks/useUser";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Home() {
  const { user } = useAuth();
  const { userData } = useUser();
  const navigate = useNavigate();

  if (!userData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
      <div style={{ fontSize: "40px", animation: "spin 1s linear infinite" }}>⏳</div>
    </div>
  );

  const xp = userData.xp || 0;
  const level = userData.level || 1;
  const streak = userData.streak || 0;
  const xpThresholds = [0, 100, 250, 500, 900, 1400, 2000, 2700];
  const nextLevelXP = xpThresholds[level] || 9999;
  const currentLevelXP = xpThresholds[level - 1] || 0;
  const progress = Math.min(100, Math.round((xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100));
  const levelNames = ["Initiate", "Apprentice", "Scholar", "Warrior", "Guardian", "Sage", "Master", "Legend"];
  const levelIcons = ["⚔️", "🛡️", "📖", "🗡️", "🦅", "🔮", "👑", "🌟"];

  const quotes = [
    { text: "Indeed, Allah does not change the condition of a people until they change themselves.", src: "Quran 13:11" },
    { text: "The best of you are those who are best in character.", src: "Prophet Muhammad ﷺ" },
    { text: "Seek knowledge from the cradle to the grave.", src: "Islamic Proverb" },
    { text: "Your body has a right over you.", src: "Prophet Muhammad ﷺ" },
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  return (
    <div style={{ padding: "16px 16px 100px", background: "#EEF2FF", minHeight: "100vh" }}>

      {/* Hero Card */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)",
        borderRadius: "28px",
        padding: "24px",
        marginBottom: "16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 12px 40px rgba(99,102,241,0.35)",
      }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-20px", left: "40px", width: "100px", height: "100px", background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "20px", right: "20px", width: "60px", height: "60px", background: "rgba(255,255,255,0.1)", borderRadius: "50%" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
            👋 Welcome back,
          </p>
          <h2 style={{ color: "white", fontSize: "32px", fontWeight: "800", marginBottom: "6px", letterSpacing: "-1px" }}>
            {user.displayName?.split(" ")[0]}! 🎮
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "20px" }}>
            Ready to level up today?
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
              borderRadius: "100px", padding: "6px 14px",
              color: "white", fontSize: "12px", fontWeight: "700",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
              {levelIcons[level - 1]} Level {level} — {levelNames[level - 1]}
            </div>
            <div style={{
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
              borderRadius: "100px", padding: "6px 14px",
              color: "white", fontSize: "12px", fontWeight: "700",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
              🔥 {streak} day streak
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {[
          { label: "Total XP", value: xp, icon: "⭐", gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", color: "#d97706", shadow: "rgba(245,158,11,0.2)" },
          { label: "Streak", value: `${streak}🔥`, icon: "", gradient: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#dc2626", shadow: "rgba(239,68,68,0.2)" },
          { label: "Level", value: level, icon: "🏅", gradient: "linear-gradient(135deg, #dcfce7, #bbf7d0)", color: "#16a34a", shadow: "rgba(16,185,129,0.2)" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: stat.gradient,
            borderRadius: "20px", padding: "16px 10px",
            textAlign: "center",
            boxShadow: `0 4px 16px ${stat.shadow}`,
          }}>
            <div style={{ fontSize: "24px", marginBottom: "4px" }}>{stat.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: stat.color, opacity: 0.7, marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* XP Progress */}
      <div style={{
        background: "white", borderRadius: "24px", padding: "20px",
        marginBottom: "16px",
        boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b" }}>XP Progress</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
              {nextLevelXP - xp} XP to {levelNames[level]} {levelIcons[level]}
            </p>
          </div>
          <div style={{
            background: "#eef2ff", borderRadius: "100px",
            padding: "6px 14px", color: "#6366f1",
            fontSize: "13px", fontWeight: "800",
          }}>
            {xp} / {nextLevelXP}
          </div>
        </div>
        <div style={{ background: "#eef2ff", borderRadius: "100px", height: "12px" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
            borderRadius: "100px", transition: "width 1s ease",
            boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Level {level}</span>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Level {level + 1}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e1b4b", marginBottom: "12px" }}>
        Quick Actions 🚀
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {[
          { icon: "⚔️", label: "Daily Missions", sub: "Complete tasks & earn XP", bg: "linear-gradient(135deg, #6366f1, #8b5cf6)", path: "/missions" },
          { icon: "👥", label: "My Groups", sub: "Group challenges", bg: "linear-gradient(135deg, #10b981, #06b6d4)", path: "/groups" },
          { icon: "🏆", label: "Leaderboard", sub: "See your rank", bg: "linear-gradient(135deg, #f59e0b, #ef4444)", path: "/leaderboard" },
          { icon: "👤", label: "Profile", sub: "Stats & friends", bg: "linear-gradient(135deg, #ec4899, #8b5cf6)", path: "/profile" },
        ].map((action, i) => (
          <div
            key={i}
            onClick={() => navigate(action.path)}
            style={{
              background: action.bg,
              borderRadius: "22px", padding: "20px 16px",
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; }}
          >
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>{action.icon}</div>
            <div style={{ color: "white", fontSize: "14px", fontWeight: "800", marginBottom: "3px" }}>{action.label}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", fontWeight: "500" }}>{action.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily Quote */}
      <div style={{
        background: "linear-gradient(135deg, #fdf4ff, #ede9fe)",
        border: "1px solid #ddd6fe",
        borderRadius: "24px", padding: "20px",
        boxShadow: "0 4px 16px rgba(139,92,246,0.1)",
      }}>
        <p style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>
          💜 DAILY REMINDER
        </p>
        <p style={{ fontSize: "14px", color: "#4c1d95", fontWeight: "500", lineHeight: "1.7", fontStyle: "italic" }}>
          "{quote.text}"
        </p>
        <p style={{ fontSize: "12px", color: "#a78bfa", marginTop: "10px", fontWeight: "700" }}>
          — {quote.src}
        </p>
      </div>

    </div>
  );
}

export default Home;