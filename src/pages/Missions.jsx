import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import { getGroupById } from "../firebase/db";

const CATEGORIES = {
  deen: { label: "Deen", icon: "☪️", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  duniya: { label: "Duniya", icon: "📚", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  health: { label: "Health", icon: "💪", color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
};

function getXPPerTask(totalTasks) {
  if (totalTasks === 0) return 0;
  return Math.floor(100 / totalTasks);
}

function MissionList({ missions, completed, onToggle, category, isPersonal, onDelete, xpPerTask }) {
  const c = CATEGORIES[category];
  const filtered = missions.filter(m => m.category === category);
  if (filtered.length === 0) return null;
  const done = filtered.filter(m => completed[m.id]).length;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", marginBottom: "8px",
        background: c.bg, border: `1px solid ${c.border}`,
        borderRadius: "14px",
      }}>
        <span style={{ fontSize: "13px", color: c.color, fontWeight: "700" }}>
          {c.icon} {c.label}
        </span>
        <span style={{
          background: c.color, color: "white",
          borderRadius: "100px", padding: "2px 10px",
          fontSize: "11px", fontWeight: "700",
        }}>
          {done}/{filtered.length}
        </span>
      </div>

      {filtered.map(mission => {
        const isDone = !!completed[mission.id];
        return (
          <div key={mission.id} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "14px 16px", marginBottom: "8px",
            borderRadius: "16px",
            background: isDone ? c.bg : "white",
            border: isDone ? `2px solid ${c.border}` : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s",
          }}>
            <div
              onClick={() => onToggle(mission, xpPerTask)}
              style={{
                width: "26px", height: "26px", borderRadius: "8px",
                border: isDone ? `2px solid ${c.color}` : "2px solid #cbd5e1",
                background: isDone ? c.color : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
                color: "white", fontWeight: "900", fontSize: "13px",
                transition: "all 0.2s",
              }}
            >
              {isDone ? "✓" : ""}
            </div>

            <div onClick={() => onToggle(mission, xpPerTask)} style={{ flex: 1, cursor: "pointer" }}>
              <div style={{
                fontSize: "14px", fontWeight: "600",
                color: isDone ? "#94a3b8" : "#1e1b4b",
                textDecoration: isDone ? "line-through" : "none",
              }}>
                {mission.title}
              </div>
            </div>

            <div style={{
              background: "#fef3c7", border: "1px solid #fde68a",
              borderRadius: "100px", padding: "3px 10px",
              color: "#d97706", fontSize: "11px", fontWeight: "700",
              flexShrink: 0,
            }}>
              +{xpPerTask} XP
            </div>

            {isPersonal && (
              <button onClick={() => onDelete(mission.id)} style={{
                background: "#fff1f2", border: "1px solid #fecdd3",
                borderRadius: "8px", color: "#ef4444",
                padding: "4px 8px", cursor: "pointer", fontSize: "12px",
                flexShrink: 0,
              }}>✕</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Missions() {
  const { user } = useAuth();
  const { addXP } = useUser();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [groups, setGroups] = useState([]);
  const [completed, setCompleted] = useState({});
  const [personalMissions, setPersonalMissions] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", category: "deen" });
  const [showAddTask, setShowAddTask] = useState(false);
  const inputRef = useRef(null); // ✅ ref to auto-focus input
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) setUserData(snap.data());
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!userData?.groups?.length) { setGroups([]); return; }
    Promise.all(userData.groups.map(id => getGroupById(id)))
      .then(data => setGroups(data.filter(g => g !== null)));
  }, [userData?.groups]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "completedMissions");
    const unsubscribe = onSnapshot(ref, snap => {
      const data = {};
      snap.forEach(d => { data[d.id] = true; });
      setCompleted(data);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "personalMissions");
    const unsubscribe = onSnapshot(ref, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPersonalMissions(data);
    });
    return unsubscribe;
  }, [user]);

  // ✅ Auto-focus input whenever form opens
  useEffect(() => {
    if (showAddTask && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showAddTask]);

  const getCurrentMissions = () => {
    if (activeTab === "personal") return personalMissions;
    const group = groups.find(g => g.id === activeTab);
    if (!group) return [];
    return [
      ...(group.missions?.deen || []).map(m => ({ ...m, category: "deen" })),
      ...(group.missions?.duniya || []).map(m => ({ ...m, category: "duniya" })),
      ...(group.missions?.health || []).map(m => ({ ...m, category: "health" })),
    ];
  };

  const missions = getCurrentMissions();
  const xpPerTask = getXPPerTask(missions.length);
  const remainder = missions.length > 0 ? 100 - (xpPerTask * missions.length) : 0;

  const toggleMission = async (mission, xp) => {
    const key = `${today}_${activeTab}_${mission.id}`;
    const ref = doc(db, "users", user.uid, "completedMissions", key);
    const missionIndex = missions.findIndex(m => m.id === mission.id);
    const actualXP = (missionIndex === missions.length - 1) ? xp + remainder : xp;

    if (completed[key]) {
      await deleteDoc(ref);
      await addXP(-actualXP);
    } else {
      await setDoc(ref, { missionId: mission.id, tab: activeTab, completedAt: new Date(), xp: actualXP });
      await addXP(actualXP);
    }
  };

  const addPersonalTask = async () => {
    if (!newTask.title.trim()) return;
    const id = `custom_${Date.now()}`;
    await setDoc(doc(db, "users", user.uid, "personalMissions", id), {
      title: newTask.title.trim(),
      category: newTask.category,
    });
    // ✅ Only clear title, keep form open + category, refocus input
    setNewTask(prev => ({ ...prev, title: "" }));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deletePersonalTask = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "personalMissions", id));
  };

  const doneCount = missions.filter(m => completed[`${today}_${activeTab}_${m.id}`]).length;
  const totalXPEarned = doneCount * xpPerTask + (completed[`${today}_${activeTab}_${missions[missions.length - 1]?.id}`] ? remainder : 0);
  const progress = missions.length > 0 ? Math.round(doneCount / missions.length * 100) : 0;

  const completedForTab = {};
  missions.forEach(m => { completedForTab[m.id] = !!completed[`${today}_${activeTab}_${m.id}`]; });

  return (
    <div style={{ padding: "20px 16px 100px", background: "#EEF2FF", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>
          ⚔️ DAILY MISSIONS
        </p>
        <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e1b4b" }}>
          Today's Quest
        </h2>
      </div>

      {/* XP Info Banner */}
      {missions.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: "16px", padding: "12px 16px",
          marginBottom: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", fontWeight: "600", letterSpacing: "1px" }}>DAILY XP POOL</div>
            <div style={{ color: "white", fontSize: "22px", fontWeight: "800" }}>100 XP</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", fontWeight: "600", letterSpacing: "1px" }}>PER TASK</div>
            <div style={{ color: "#fbbf24", fontSize: "22px", fontWeight: "800" }}>{xpPerTask} XP</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", fontWeight: "600", letterSpacing: "1px" }}>TASKS</div>
            <div style={{ color: "white", fontSize: "22px", fontWeight: "800" }}>{missions.length}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
        <button
          onClick={() => setActiveTab("personal")}
          style={{
            flexShrink: 0, padding: "8px 16px",
            background: activeTab === "personal" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "white",
            border: activeTab === "personal" ? "none" : "1px solid #e2e8f0",
            borderRadius: "100px",
            color: activeTab === "personal" ? "white" : "#64748b",
            fontSize: "12px", fontWeight: "700", cursor: "pointer",
            boxShadow: activeTab === "personal" ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
          }}
        >
          👤 Personal
        </button>
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => setActiveTab(group.id)}
            style={{
              flexShrink: 0, padding: "8px 16px",
              background: activeTab === group.id ? "linear-gradient(135deg, #10b981, #06b6d4)" : "white",
              border: activeTab === group.id ? "none" : "1px solid #e2e8f0",
              borderRadius: "100px",
              color: activeTab === group.id ? "white" : "#64748b",
              fontSize: "12px", fontWeight: "700", cursor: "pointer",
              boxShadow: activeTab === group.id ? "0 4px 12px rgba(16,185,129,0.3)" : "none",
            }}
          >
            ⚔️ {group.name}
          </button>
        ))}
      </div>

      {/* Progress Card */}
      <div style={{
        background: "white", borderRadius: "20px", padding: "16px 18px",
        marginBottom: "16px", boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
        border: "1px solid #e0e7ff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e1b4b" }}>Daily Progress</span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1" }}>
            {doneCount}/{missions.length} · +{totalXPEarned}/100 XP
          </span>
        </div>
        <div style={{ background: "#eef2ff", borderRadius: "100px", height: "10px" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: progress === 100
              ? "linear-gradient(90deg, #10b981, #06b6d4)"
              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: "100px", transition: "width 0.5s ease",
          }} />
        </div>
        {progress === 100 && (
          <p style={{ fontSize: "12px", color: "#10b981", fontWeight: "700", marginTop: "8px", textAlign: "center" }}>
            🎉 All done! +100 XP earned! MashaAllah!
          </p>
        )}
      </div>

      {/* Mission Lists */}
      {missions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "50px 20px",
          background: "white", borderRadius: "24px",
          border: "1px solid #e0e7ff",
          boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
          <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e1b4b", marginBottom: "6px" }}>No Missions Yet</p>
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>
            {activeTab === "personal" ? "Add your first mission below!" : "Admin hasn't added missions yet."}
          </p>
        </div>
      ) : (
        ["deen", "duniya", "health"].map(cat => (
          <MissionList
            key={cat}
            missions={missions}
            completed={completedForTab}
            onToggle={toggleMission}
            category={cat}
            isPersonal={activeTab === "personal"}
            onDelete={deletePersonalTask}
            xpPerTask={xpPerTask}
          />
        ))
      )}

      {/* Add Personal Mission */}
      {activeTab === "personal" && (
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            style={{
              width: "100%", padding: "14px",
              background: showAddTask ? "#eef2ff" : "white",
              border: "2px dashed #c7d2fe",
              borderRadius: "16px", color: "#6366f1",
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
            }}
          >
            {showAddTask ? "✕ Cancel" : "＋ Add Personal Mission"}
          </button>

          {showAddTask && (
            <div style={{
              marginTop: "10px", padding: "16px",
              background: "white", border: "1px solid #e0e7ff",
              borderRadius: "20px",
              boxShadow: "0 4px 16px rgba(99,102,241,0.08)",
            }}>
              {/* XP hint — updates live as tasks are added */}
              <div style={{
                background: "#fef3c7", border: "1px solid #fde68a",
                borderRadius: "10px", padding: "8px 12px",
                marginBottom: "10px", fontSize: "12px",
                color: "#92400e", fontWeight: "600", textAlign: "center",
              }}>
                💡 Each task worth <strong>{getXPPerTask(missions.length + 1)} XP</strong> · Press Enter or tap Add
              </div>

              {/* ✅ ref + onKeyDown Enter to add without clicking button */}
              <input
                ref={inputRef}
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") addPersonalTask(); }}
                placeholder="Type mission & press Enter..."
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: "10px",
                  background: "#f8fafc", border: "1px solid #c7d2fe",
                  borderRadius: "12px", color: "#1e1b4b",
                  fontSize: "14px", outline: "none",
                  boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />

              <div style={{ marginBottom: "10px" }}>
                <select
                  value={newTask.category}
                  onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: "12px", color: "#1e1b4b",
                    fontSize: "13px", outline: "none",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <option value="deen">☪️ Deen</option>
                  <option value="duniya">📚 Duniya</option>
                  <option value="health">💪 Health</option>
                </select>
              </div>

              <button
                onClick={addPersonalTask}
                style={{
                  width: "100%", padding: "13px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", borderRadius: "14px", color: "white",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Add Mission ✨
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Missions;