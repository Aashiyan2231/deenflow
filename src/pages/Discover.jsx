import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPublicContests, joinPublicContest } from "../firebase/db";

function DiscoverCard({ contest, onJoin, busy }) {
  const statusColor = contest.status === "active" ? "#8b5cf6" : contest.status === "ended" ? "#4b5563" : "#a78bfa";
  return (
    <div style={styles.card}>
      <div>
        <p style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 16, margin: 0 }}>
          {contest.name}
        </p>
        <p style={{ color: "#4b5563", fontSize: 13, margin: "2px 0 0" }}>
          {contest.adminName} · {contest.missions?.tasks?.length || contest.tasks?.length || 0} videos · {contest.members?.length || 0}{contest.maxParticipants ? `/${contest.maxParticipants}` : ""} participants
        </p>
      </div>
      <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{contest.status || "waiting"}</span>
      <button
        style={styles.joinBtn}
        disabled={busy}
        onClick={() => onJoin(contest.id)}
      >
        Join
      </button>
    </div>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicContests()
      .then(setContests)
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(contestId) {
    setJoiningId(contestId);
    setError("");
    try {
      await joinPublicContest(contestId, { uid: user.uid, name: user.name });
      navigate(`/contests/${contestId}`);
    } catch (e) {
      setError("Couldn't join that contest.");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Discover contests</h1>
      <p style={styles.subtitle}>Public contests anyone can join</p>

      {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}

      {loading ? (
        <span style={{ color: "#4b5563" }}>Loading…</span>
      ) : contests.length === 0 ? (
        <p style={{ color: "#4b5563", fontSize: 14 }}>
          No public contests right now. Check back soon.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contests.map((c) => (
            <DiscoverCard
              key={c.id}
              contest={c}
              onJoin={handleJoin}
              busy={joiningId === c.id}
            />
          ))}
        </div>
      )}
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
    gap: 20,
  },
  title: { color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 },
  subtitle: { color: "#4b5563", fontSize: 13, margin: "-14px 0 0" },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    background: "#160F26",
    border: "1px solid rgba(139,92,246,0.15)",
  },
  joinBtn: {
    background: "#8b5cf6",
    border: "none",
    color: "#F0F4FF",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
