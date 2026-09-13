import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import { createGroup, joinGroupByCode } from "../firebase/db";

function StatusTag({ status }) {
  const map = {
    waiting: { label: "Waiting to start", color: "#a78bfa" },
    active: { label: "In progress", color: "#8b5cf6" },
    ended: { label: "Ended", color: "#4b5563" },
  };
  const s = map[status] || map.waiting;
  return (
    <span
      style={{
        color: s.color,
        fontSize: 12,
        fontWeight: 600,
        background: "rgba(139,92,246,0.1)",
        padding: "4px 10px",
        borderRadius: 999,
      }}
    >
      {s.label}
    </span>
  );
}

function ContestRow({ contest }) {
  return (
    <Link
      to={`/contests/${contest.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 16,
        borderRadius: 16,
        background: "#160F26",
        border: "1px solid rgba(139,92,246,0.15)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#F0F4FF", fontWeight: 600, fontSize: 16, margin: 0 }}>
            {contest.name}
          </p>
          <p style={{ color: "#4b5563", fontSize: 13, margin: "2px 0 0" }}>
            {contest.subject} · {contest.members?.length || 0} members
          </p>
        </div>
        <StatusTag status={contest.status} />
      </div>
      <p style={{ color: "#818cf8", fontSize: 12, margin: 0 }}>
        Hosted by {contest.adminName}
      </p>
    </Link>
  );
}

export default function Contests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contests = [], loading } = useUser();

  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim() || !subject.trim()) {
      setError("Give your contest a name and subject.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const groupId = await createGroup({
        name: name.trim(),
        subject: subject.trim(),
        adminId: user.uid,
        adminName: user.name,
      });
      navigate(`/contests/${groupId}`);
    } catch (e) {
      setError("Couldn't create the contest. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) {
      setError("Enter an invite code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const groupId = await joinGroupByCode(code.trim().toUpperCase(), {
        uid: user.uid,
        name: user.name,
      });
      navigate(`/contests/${groupId}`);
    } catch (e) {
      setError("That code didn't match a contest.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Contests</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.smallBtn} onClick={() => setMode("join")}>
            Join
          </button>
          <button style={styles.smallBtnPrimary} onClick={() => setMode("create")}>
            New
          </button>
        </div>
      </div>

      {mode && (
        <div style={styles.panel}>
          {mode === "create" ? (
            <>
              <input
                style={styles.input}
                placeholder="Contest name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Subject (e.g. DSA, Physics)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </>
          ) : (
            <input
              style={styles.input}
              placeholder="Invite code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          )}
          {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={styles.smallBtnPrimary}
              disabled={busy}
              onClick={mode === "create" ? handleCreate : handleJoin}
            >
              {busy ? "Please wait…" : mode === "create" ? "Create" : "Join"}
            </button>
            <button style={styles.smallBtn} onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <span style={{ color: "#4b5563" }}>Loading contests…</span>
      ) : contests.length === 0 ? (
        <p style={styles.emptyText}>
          You haven't joined a contest yet. Create one or join with an invite code.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contests.map((c) => (
            <ContestRow key={c.id} contest={c} />
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 },
  smallBtn: {
    background: "transparent",
    border: "1px solid rgba(139,92,246,0.3)",
    color: "#a78bfa",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  smallBtnPrimary: {
    background: "#8b5cf6",
    border: "none",
    color: "#F0F4FF",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#160F26",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: 14,
    padding: 16,
  },
  input: {
    background: "#0F0A1E",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#F0F4FF",
    fontSize: 14,
    outline: "none",
  },
  emptyText: { color: "#4b5563", fontSize: 14, margin: 0 },
};
