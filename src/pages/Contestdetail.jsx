import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import { addTaskToGroup, startGroupChallenge, endGroupChallenge } from "../firebase/db";

export default function ContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contests = [], activeContests = [], toggleContestTask, loading } = useUser();

  const [taskTitle, setTaskTitle] = useState("");
  const [taskXp, setTaskXp] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [winnerUid, setWinnerUid] = useState(null);

  const all = [...contests, ...activeContests];
  const contest = all.find((c) => c.id === id);

  if (loading) {
    return <div style={styles.page}><span style={{ color: "#4b5563" }}>Loading…</span></div>;
  }
  if (!contest) {
    return (
      <div style={styles.page}>
        <span style={{ color: "#4b5563" }}>Contest not found.</span>
      </div>
    );
  }

  const isAdmin = contest.adminId === user?.uid || contest.adminName === user?.name;
  const tasks = contest.tasks || contest.missions?.tasks || [];
  const isEnded = contest.status === "ended" || Boolean(winnerUid);

  async function handleAddTask() {
    if (!taskTitle.trim()) return;
    setBusy(true);
    setError("");
    try {
      await addTaskToGroup(id, { title: taskTitle.trim(), xp: Number(taskXp) || 0 });
      setTaskTitle("");
      setTaskXp(20);
    } catch (e) {
      setError("Couldn't add the task.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      await startGroupChallenge(id);
    } catch (e) {
      setError("Couldn't start the contest.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    setBusy(true);
    setError("");
    try {
      const winner = await endGroupChallenge(id);
      setWinnerUid(winner);
    } catch (e) {
      setError("Couldn't end the contest.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/contests")}>
        ← Back
      </button>

      <div>
        <h1 style={styles.title}>{contest.name}</h1>
        <p style={styles.subtitle}>
          {contest.subject} · {isEnded ? "ended" : contest.status} · {contest.members?.length || 0} members
        </p>
        {contest.inviteCode && (
          <p style={styles.inviteCode}>Invite code: {contest.inviteCode}</p>
        )}
      </div>

      {isEnded && (
        <div style={styles.winnerBanner}>
          🏆 Contest ended — winner declared, XP and badge updated.
        </div>
      )}

      {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}

      {isAdmin && contest.status === "waiting" && (
        <div style={styles.panel}>
          <p style={styles.panelLabel}>Add a task</p>
          <input
            style={styles.input}
            placeholder="e.g. Solve 5 LeetCode problems"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="XP value"
            value={taskXp}
            onChange={(e) => setTaskXp(e.target.value)}
          />
          <button style={styles.primaryBtn} disabled={busy} onClick={handleAddTask}>
            Add task
          </button>
          <button style={styles.primaryBtn} disabled={busy} onClick={handleStart}>
            Start challenge
          </button>
        </div>
      )}

      {isAdmin && contest.status === "active" && !isEnded && (
        <div style={styles.panel}>
          <p style={styles.panelLabel}>Contest in progress</p>
          <button style={styles.dangerBtn} disabled={busy} onClick={handleEnd}>
            {busy ? "Ending…" : "End contest"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.length === 0 ? (
          <p style={{ color: "#4b5563", fontSize: 14 }}>No tasks added yet.</p>
        ) : (
          tasks.map((task) => {
            const done = contest.completedTaskIds?.includes(task.id);
            return (
              <div
                key={task.id}
                onClick={() =>
                  contest.status === "active" &&
                  !isEnded &&
                  toggleContestTask(id, task.id, task.xp)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: done ? "rgba(139,92,246,0.08)" : "#160F26",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: 14,
                  cursor: contest.status === "active" && !isEnded ? "pointer" : "default",
                }}
              >
                <span style={{ flex: 1, color: done ? "#4b5563" : "#F0F4FF", fontSize: 15 }}>
                  {task.title}
                </span>
                <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 600 }}>
                  +{task.xp} XP
                </span>
              </div>
            );
          })
        )}
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
    gap: 20,
  },
  backBtn: {
    alignSelf: "flex-start",
    background: "transparent",
    border: "none",
    color: "#a78bfa",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
  },
  title: { color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 },
  subtitle: { color: "#4b5563", fontSize: 13, margin: "4px 0 0" },
  inviteCode: { color: "#818cf8", fontSize: 13, margin: "6px 0 0", fontWeight: 600 },
  winnerBanner: {
    background: "rgba(139,92,246,0.12)",
    border: "1px solid rgba(139,92,246,0.35)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#F0F4FF",
    fontSize: 14,
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
  panelLabel: { color: "#a78bfa", fontSize: 13, fontWeight: 600, margin: 0 },
  input: {
    background: "#0F0A1E",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#F0F4FF",
    fontSize: 14,
    outline: "none",
  },
  primaryBtn: {
    background: "#8b5cf6",
    border: "none",
    color: "#F0F4FF",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerBtn: {
    background: "transparent",
    border: "1px solid #f87171",
    color: "#f87171",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
