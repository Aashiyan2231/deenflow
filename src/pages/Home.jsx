import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import StudyTimer from "../components/StudyTimer";

// Level thresholds — mirrors the XP table used across the app
const LEVELS = [
  { name: "Initiate", min: 0 },
  { name: "Scholar", min: 100 },
  { name: "Strategist", min: 250 },
  { name: "Grinder", min: 500 },
  { name: "Sharpshooter", min: 900 },
  { name: "Vanguard", min: 1400 },
  { name: "Champion", min: 2000 },
  { name: "Legend", min: 2700 },
];

function getLevelProgress(xp) {
  const idx = LEVELS.reduce(
    (acc, lvl, i) => (xp >= lvl.min ? i : acc),
    0
  );
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const span = next ? next.min - current.min : 1;
  const into = next ? xp - current.min : 1;
  const pct = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return {
    levelIndex: idx + 1,
    levelName: current.name,
    nextName: next ? next.name : null,
    xpIntoLevel: into,
    xpToNext: next ? next.min - xp : 0,
    pct,
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Circular XP ring — the one bold element on the page
function XPRing({ pct, levelIndex, levelName }) {
  const size = 156;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2A1F3D"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 700, color: "#F0F4FF", lineHeight: 1 }}>
          {levelIndex}
        </span>
        <span style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>{levelName}</span>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle }) {
  return (
    <div
      onClick={() => onToggle(task.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: task.done ? "rgba(139,92,246,0.08)" : "#160F26",
        border: "1px solid rgba(139,92,246,0.15)",
        borderRadius: 14,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: `2px solid ${task.done ? "#8b5cf6" : "#4b5563"}`,
          background: task.done ? "#8b5cf6" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {task.done && (
          <span style={{ color: "#F0F4FF", fontSize: 13, lineHeight: 1 }}>✓</span>
        )}
      </div>
      <span
        style={{
          flex: 1,
          color: task.done ? "#4b5563" : "#F0F4FF",
          textDecoration: task.done ? "line-through" : "none",
          fontSize: 15,
        }}
      >
        {task.title}
      </span>
      <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 600 }}>
        +{task.xp} XP
      </span>
    </div>
  );
}

function ContestCard({ contest }) {
  const pct = contest.total
    ? Math.round((contest.completed / contest.total) * 100)
    : 0;
  return (
    <Link
      to={`/contests/${contest.id}`}
      style={{
        minWidth: 200,
        padding: 16,
        borderRadius: 16,
        background: "linear-gradient(160deg, #1A1229 0%, #160F26 100%)",
        border: "1px solid rgba(139,92,246,0.2)",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 15 }}>
        {contest.name}
      </span>
      <span style={{ color: "#a78bfa", fontSize: 12 }}>{contest.subject}</span>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#2A1F3D",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#8b5cf6",
            borderRadius: 999,
          }}
        />
      </div>
      <span style={{ color: "#4b5563", fontSize: 12 }}>
        {contest.completed}/{contest.total} tasks today
      </span>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const {
    xp = 0,
    streak = 0,
    personalTasks = [],
    activeContests = [],
    toggleTask,
    loading,
  } = useUser();

  const progress = useMemo(() => getLevelProgress(xp), [xp]);

  if (loading) {
    return (
      <div style={styles.page}>
        <span style={{ color: "#4b5563" }}>Loading your dashboard…</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.greeting}>
            {greeting()}, {user?.name || "there"}
          </p>
          <p style={styles.subGreeting}>
            {personalTasks.filter((t) => !t.done).length} tasks left today
          </p>
        </div>
        {streak > 0 && (
          <div style={styles.streakPill}>
            <span>🔥</span>
            <span style={{ fontWeight: 700 }}>{streak}</span>
          </div>
        )}
      </div>

      <div style={styles.ringSection}>
        <XPRing
          pct={progress.pct}
          levelIndex={progress.levelIndex}
          levelName={progress.levelName}
        />
        <div style={{ marginTop: 12, textAlign: "center" }}>
          {progress.nextName ? (
            <span style={{ color: "#4b5563", fontSize: 13 }}>
              {progress.xpToNext} XP to {progress.nextName}
            </span>
          ) : (
            <span style={{ color: "#a78bfa", fontSize: 13 }}>Max level reached</span>
          )}
        </div>
      </div>

      <StudyTimer onSessionEnd={(seconds) => console.log("studied", seconds, "sec")} />

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Today's focus</h2>
        {personalTasks.length === 0 ? (
          <p style={styles.emptyText}>
            No tasks yet. Add one to start earning XP today.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {personalTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.sectionTitle}>Your contests</h2>
          <Link to="/contest" style={styles.viewAllLink}>
            View all
          </Link>
        </div>
        {activeContests.length === 0 ? (
          <p style={styles.emptyText}>
            You're not in a contest yet. Join or start one to compete.
          </p>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {activeContests.map((c) => (
              <ContestCard key={c.id} contest={c} />
            ))}
          </div>
        )}
      </section>
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
    gap: 28,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { color: "#F0F4FF", fontSize: 20, fontWeight: 700, margin: 0 },
  subGreeting: { color: "#4b5563", fontSize: 13, margin: "4px 0 0" },
  streakPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#1A1229",
    border: "1px solid rgba(139,92,246,0.25)",
    borderRadius: 999,
    padding: "6px 12px",
    color: "#F0F4FF",
    fontSize: 14,
  },
  ringSection: { display: "flex", flexDirection: "column", alignItems: "center" },
  section: { display: "flex", flexDirection: "column", gap: 14 },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#F0F4FF", fontSize: 17, fontWeight: 600, margin: 0 },
  viewAllLink: { color: "#818cf8", fontSize: 13, textDecoration: "none" },
  emptyText: { color: "#4b5563", fontSize: 14, margin: 0 },
};
