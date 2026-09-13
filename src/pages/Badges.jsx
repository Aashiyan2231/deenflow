import React, { useMemo } from "react";
import { useUser } from "../hooks/useUser";

// Badges derived entirely from existing xp/level/streak data — no new Firestore fields needed
const BADGE_DEFS = [
  { id: "first_step", label: "First Step", desc: "Complete your first task", check: (s) => s.tasksCompletedTotal >= 1 },
  { id: "scholar", label: "Scholar", desc: "Reach level 2 (Scholar)", check: (s) => s.level >= 2 },
  { id: "grinder", label: "Grinder", desc: "Reach level 4 (Grinder)", check: (s) => s.level >= 4 },
  { id: "legend", label: "Legend", desc: "Reach max level (Legend)", check: (s) => s.level >= 8 },
  { id: "streak_3", label: "3-Day Streak", desc: "Study 3 days in a row", check: (s) => s.streak >= 3 },
  { id: "streak_7", label: "Week Warrior", desc: "Study 7 days in a row", check: (s) => s.streak >= 7 },
  { id: "streak_30", label: "Unstoppable", desc: "Study 30 days in a row", check: (s) => s.streak >= 30 },
  { id: "contender", label: "Contender", desc: "Join your first contest", check: (s) => s.contestsJoined >= 1 },
  { id: "champion_contest", label: "Champion", desc: "Win a contest", check: (s) => s.contestsWon >= 1 },
  { id: "task_100", label: "Centurion", desc: "Complete 100 tasks total", check: (s) => s.tasksCompletedTotal >= 100 },
];

function BadgeCard({ badge, earned }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: 16,
        borderRadius: 16,
        background: earned ? "linear-gradient(160deg, #2a1f4d 0%, #160F26 100%)" : "#120B1E",
        border: earned ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(139,92,246,0.08)",
        opacity: earned ? 1 : 0.45,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: earned ? "#8b5cf6" : "#2A1F3D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {earned ? "🏆" : "🔒"}
      </div>
      <span style={{ color: "#F0F4FF", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
        {badge.label}
      </span>
      <span style={{ color: "#4b5563", fontSize: 11, textAlign: "center" }}>{badge.desc}</span>
    </div>
  );
}

export default function Badges() {
  const {
    level = 1,
    streak = 0,
    contests = [],
    tasksCompletedTotal = 0,
    contestsWon = 0,
    loading,
  } = useUser();

  const stats = useMemo(
    () => ({
      level,
      streak,
      contestsJoined: contests.length,
      contestsWon,
      tasksCompletedTotal,
    }),
    [level, streak, contests.length, contestsWon, tasksCompletedTotal]
  );

  const earnedCount = BADGE_DEFS.filter((b) => b.check(stats)).length;

  if (loading) {
    return (
      <div style={styles.page}>
        <span style={{ color: "#4b5563" }}>Loading badges…</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div>
        <h1 style={styles.title}>Badges</h1>
        <p style={styles.subtitle}>
          {earnedCount}/{BADGE_DEFS.length} earned
        </p>
      </div>

      <div style={styles.grid}>
        {BADGE_DEFS.map((b) => (
          <BadgeCard key={b.id} badge={b} earned={b.check(stats)} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0F0A1E",
    padding: "24px 20px 100px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  title: { color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 },
  subtitle: { color: "#a78bfa", fontSize: 13, margin: "4px 0 0" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: 12,
  },
};
