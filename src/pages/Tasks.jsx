import React, { useState } from "react";
import { useUser } from "../hooks/useUser";
import { addPersonalTask } from "../firebase/db";

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
        {task.done && <span style={{ color: "#F0F4FF", fontSize: 13, lineHeight: 1 }}>✓</span>}
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
      <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 600 }}>+{task.xp} XP</span>
    </div>
  );
}

export default function Tasks() {
  const { personalTasks = [], activeContests = [], toggleTask, toggleContestTask, loading } =
    useUser();

  const [tab, setTab] = useState("personal"); // "personal" | contestId
  const [title, setTitle] = useState("");
  const [xp, setXp] = useState(20);
  const [busy, setBusy] = useState(false);

  const tabs = [{ id: "personal", label: "Personal" }].concat(
    activeContests.map((c) => ({ id: c.id, label: c.name }))
  );

  async function handleAdd() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addPersonalTask({ title: title.trim(), xp: Number(xp) || 0 });
      setTitle("");
      setXp(20);
    } finally {
      setBusy(false);
    }
  }

  const activeContest = activeContests.find((c) => c.id === tab);
  const list =
    tab === "personal"
      ? personalTasks
      : (activeContest?.tasks || []).map((t) => ({
          ...t,
          done: activeContest?.completedTaskIds?.includes(t.id),
        }));

  function handleToggle(taskId) {
    if (tab === "personal") toggleTask(taskId);
    else {
      const task = activeContest?.tasks?.find((t) => t.id === taskId);
      toggleContestTask(tab, taskId, task?.xp || 0);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Tasks</h1>

      <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tabBtn,
              background: tab === t.id ? "#8b5cf6" : "transparent",
              color: tab === t.id ? "#F0F4FF" : "#a78bfa",
              borderColor: tab === t.id ? "#8b5cf6" : "rgba(139,92,246,0.3)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "personal" && (
        <div style={styles.panel}>
          <input
            style={styles.input}
            placeholder="New task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="XP value"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
          />
          <button style={styles.primaryBtn} disabled={busy} onClick={handleAdd}>
            Add
          </button>
        </div>
      )}

      {loading ? (
        <span style={{ color: "#4b5563" }}>Loading tasks…</span>
      ) : list.length === 0 ? (
        <p style={{ color: "#4b5563", fontSize: 14 }}>No tasks here yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
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
  tabBtn: {
    border: "1px solid",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
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
};
