import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createGroup, joinGroup, getGroupById } from "../firebase/db";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [subject, setSubject] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), snap => {
      if (snap.exists()) setUserData(snap.data());
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!userData?.groups?.length) { setMyGroups([]); return; }
    Promise.all(userData.groups.map(id => getGroupById(id)))
      .then(data => setMyGroups(data.filter(Boolean)));
  }, [userData?.groups]);

  const handleCreate = async () => {
    if (!groupName.trim() || !subject.trim()) {
      setMessage({ text: "Fill in all fields!", error: true });
      return;
    }
    setLoading(true);
    const result = await createGroup(user, groupName.trim(), subject.trim());
    setLoading(false);
    if (result.success) {
      setMessage({ text: `Group created! Code: ${result.inviteCode}`, error: false });
      setGroupName(""); setSubject(""); setShowCreate(false);
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    const result = await joinGroup(user, inviteCode.trim());
    setLoading(false);
    if (result.error) {
      setMessage({ text: result.error, error: true });
    } else {
      setMessage({ text: `Joined ${result.groupName}! 🎉`, error: false });
      setInviteCode(""); setShowJoin(false);
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleShareLink = (group) => {
    const link = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(link);
    setMessage({ text: "Invite link copied! 🔗 Share it with friends!", error: false });
    setTimeout(() => setMessage(null), 3000);
  };

  const isAdmin = (group) => group.adminId === user.uid;

  const statusColors = {
    waiting: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
    active:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    ended:   { bg: "#fff1f2", color: "#dc2626", border: "#fecdd3" },
  };

  return (
    <div style={{ padding: "20px 16px 100px", background: "#EEF2FF", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>
          👥 CHALLENGE GROUPS
        </p>
        <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e1b4b" }}>
          My Groups
        </h2>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: "12px 16px", marginBottom: "16px",
          background: message.error ? "#fff1f2" : "#f0fdf4",
          border: `1px solid ${message.error ? "#fecdd3" : "#bbf7d0"}`,
          borderRadius: "14px",
          color: message.error ? "#dc2626" : "#16a34a",
          fontSize: "13px", fontWeight: "600",
        }}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }} style={{
          padding: "14px",
          background: showCreate ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "white",
          border: showCreate ? "none" : "2px dashed #c7d2fe",
          borderRadius: "16px",
          color: showCreate ? "white" : "#6366f1",
          fontSize: "13px", fontWeight: "700", cursor: "pointer",
          boxShadow: showCreate ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          ➕ Create Group
        </button>
        <button onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }} style={{
          padding: "14px",
          background: showJoin ? "linear-gradient(135deg, #10b981, #06b6d4)" : "white",
          border: showJoin ? "none" : "2px dashed #6ee7b7",
          borderRadius: "16px",
          color: showJoin ? "white" : "#059669",
          fontSize: "13px", fontWeight: "700", cursor: "pointer",
          boxShadow: showJoin ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          🔗 Join Group
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{
          background: "white", border: "1px solid #e0e7ff",
          borderRadius: "24px", padding: "20px", marginBottom: "16px",
          boxShadow: "0 4px 16px rgba(99,102,241,0.08)",
        }}>
          <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b", marginBottom: "14px" }}>
            Create New Group
          </p>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name (e.g. Maths Warriors)"
            style={{
              width: "100%", padding: "12px 14px", marginBottom: "10px",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: "12px", color: "#1e1b4b", fontSize: "14px",
              outline: "none", boxSizing: "border-box",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject (e.g. Mathematics, Deen)"
            style={{
              width: "100%", padding: "12px 14px", marginBottom: "14px",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: "12px", color: "#1e1b4b", fontSize: "14px",
              outline: "none", boxSizing: "border-box",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <button onClick={handleCreate} disabled={loading} style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: "14px", color: "white",
            fontSize: "14px", fontWeight: "700", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {loading ? "Creating..." : "Create Group 🚀"}
          </button>
        </div>
      )}

      {/* Join Form */}
      {showJoin && (
        <div style={{
          background: "white", border: "1px solid #d1fae5",
          borderRadius: "24px", padding: "20px", marginBottom: "16px",
          boxShadow: "0 4px 16px rgba(16,185,129,0.08)",
        }}>
          <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b", marginBottom: "14px" }}>
            Join a Group
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="INVITE CODE"
              maxLength={8}
              style={{
                flex: 1, padding: "12px 14px",
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: "12px", color: "#1e1b4b",
                fontSize: "14px", fontWeight: "700", letterSpacing: "2px",
                outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            <button onClick={handleJoin} disabled={loading} style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              border: "none", borderRadius: "12px", color: "white",
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {loading ? "..." : "Join"}
            </button>
          </div>
        </div>
      )}

      {/* Groups List */}
      {myGroups.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "50px 20px",
          background: "white", borderRadius: "24px",
          border: "1px solid #e0e7ff",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚔️</div>
          <p style={{ fontSize: "15px", fontWeight: "700", color: "#1e1b4b", marginBottom: "6px" }}>
            No Groups Yet
          </p>
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>
            Create a group or join with an invite code
          </p>
        </div>
      ) : (
        myGroups.map(group => {
          const sc = statusColors[group.status] || statusColors.waiting;
          return (
            <div key={group.id} style={{
              background: "white", borderRadius: "24px", padding: "18px",
              marginBottom: "12px", boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
              border: "1px solid #e0e7ff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e1b4b", marginBottom: "4px" }}>
                    {group.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {group.subject} · {group.members.length} members
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  {isAdmin(group) && (
                    <span style={{
                      background: "#eef2ff", border: "1px solid #c7d2fe",
                      borderRadius: "100px", padding: "3px 10px",
                      color: "#6366f1", fontSize: "10px", fontWeight: "700",
                    }}>ADMIN</span>
                  )}
                  <span style={{
                    background: sc.bg, border: `1px solid ${sc.border}`,
                    borderRadius: "100px", padding: "3px 10px",
                    color: sc.color, fontSize: "10px", fontWeight: "700",
                  }}>
                    {group.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Invite Code + Share Link */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#f8fafc", borderRadius: "12px", padding: "10px 14px",
                marginBottom: "12px", gap: "8px",
              }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", whiteSpace: "nowrap" }}>INVITE CODE</span>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#6366f1", letterSpacing: "2px", flex: 1 }}>
                  {group.inviteCode}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(group.inviteCode);
                      setMessage({ text: "Code copied! 📋", error: false });
                      setTimeout(() => setMessage(null), 2000);
                    }}
                    style={{
                      padding: "5px 10px", background: "#eef2ff",
                      border: "1px solid #c7d2fe", borderRadius: "8px",
                      color: "#6366f1", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleShareLink(group)}
                    style={{
                      padding: "5px 10px", background: "#ecfdf5",
                      border: "1px solid #6ee7b7", borderRadius: "8px",
                      color: "#059669", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🔗 Share
                  </button>
                </div>
              </div>

              {/* Mission counts */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                {["deen", "duniya", "health"].map(cat => (
                  <div key={cat} style={{
                    flex: 1, textAlign: "center", padding: "8px",
                    background: "#f8fafc", borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <div style={{ fontSize: "14px" }}>
                      {cat === "deen" ? "☪️" : cat === "duniya" ? "📚" : "💪"}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e1b4b" }}>
                      {(group.missions?.[cat] || []).length}
                    </div>
                    <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "600" }}>
                      {cat.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(`/group/${group.id}`)}
                style={{
                  width: "100%", padding: "12px",
                  background: isAdmin(group)
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(135deg, #10b981, #06b6d4)",
                  border: "none", borderRadius: "14px", color: "white",
                  fontSize: "13px", fontWeight: "700", cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {isAdmin(group) ? "⚙️ Manage Group" : "⚔️ View Group"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Groups;
