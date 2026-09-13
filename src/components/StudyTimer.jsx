import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "studybattle_timer_start";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function StudyTimer({ onSessionEnd }) {
  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  function handleStart() {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setStartTime(now);
    setElapsed(0);
  }

  function handleStop() {
    clearInterval(intervalRef.current);
    const finalElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    localStorage.removeItem(STORAGE_KEY);
    setStartTime(null);
    setElapsed(0);
    if (onSessionEnd) onSessionEnd(finalElapsed);
  }

  const running = Boolean(startTime);

  return (
    <div style={styles.card}>
      <p style={styles.label}>Study timer</p>
      <p style={styles.time}>{formatTime(elapsed)}</p>
      <button
        style={{
          ...styles.btn,
          background: running ? "transparent" : "#8b5cf6",
          border: running ? "1px solid rgba(139,92,246,0.4)" : "none",
          color: running ? "#a78bfa" : "#F0F4FF",
        }}
        onClick={running ? handleStop : handleStart}
      >
        {running ? "End session" : "Start studying"}
      </button>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    background: "#160F26",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: 16,
    padding: 20,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  label: { color: "#a78bfa", fontSize: 13, fontWeight: 600, margin: 0 },
  time: {
    color: "#F0F4FF",
    fontSize: 34,
    fontWeight: 700,
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  btn: {
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
