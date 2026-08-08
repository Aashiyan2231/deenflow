import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query, doc, getDocs, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(250,191,36,0.25); }
    50% { box-shadow: 0 0 35px rgba(250,191,36,0.5); }
  }
  @keyframes silver-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(148,163,184,0.2); }
    50% { box-shadow: 0 0 35px rgba(148,163,184,0.4); }
  }
  @keyframes bronze-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(205,127,50,0.2); }
    50% { box-shadow: 0 0 35px rgba(205,127,50,0.4); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes rowSlide {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes crown-float {
    0%, 100% { transform: translateY(0px) rotate(-5deg); }
    50% { transform: translateY(-6px) rotate(5deg); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .lb-wrap * { box-sizing: border-box; }
  .lb-wrap {
    padding: 20px 16px 100px;
    max-width: 820px;
    margin: 0 auto;
    font-family: 'Rajdhani', sans-serif;
  }

  .lb-header {
    margin-bottom: 28px;
    animation: fadeInUp 0.6s ease both;
    text-align: center;
  }
  .lb-eyebrow {
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    color: #7c3aed;
    letter-spacing: 4px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .lb-eyebrow::before, .lb-eyebrow::after {
    content: '';
    display: block;
    width: 32px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #7c3aed);
  }
  .lb-eyebrow::after { background: linear-gradient(90deg, #7c3aed, transparent); }
  .lb-title {
    font-family: 'Orbitron', monospace;
    font-size: 32px;
    font-weight: 900;
    background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1;
    letter-spacing: 2px;
  }
  .lb-subtitle {
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
    letter-spacing: 2px;
    font-family: 'Orbitron', monospace;
  }

  .lb-podium {
    display: grid;
    grid-template-columns: 1fr 1.1fr 1fr;
    gap: 10px;
    margin-bottom: 24px;
    align-items: end;
  }
  .podium-card {
    border-radius: 20px;
    padding: 20px 10px 16px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.25s ease;
    animation: fadeInUp 0.6s ease both;
  }
  .podium-card:hover { transform: translateY(-4px); }
  .podium-1 {
    background: linear-gradient(160deg, rgba(250,191,36,0.15) 0%, rgba(251,146,60,0.08) 100%);
    border: 1.5px solid rgba(250,191,36,0.5);
    animation: pulse-glow 3s ease-in-out infinite, fadeInUp 0.6s ease both;
  }
  .podium-2 {
    background: linear-gradient(160deg, rgba(148,163,184,0.12) 0%, rgba(100,116,139,0.06) 100%);
    border: 1.5px solid rgba(148,163,184,0.4);
    animation: silver-pulse 3.5s ease-in-out infinite, fadeInUp 0.6s ease 0.05s both;
  }
  .podium-3 {
    background: linear-gradient(160deg, rgba(205,127,50,0.12) 0%, rgba(180,83,9,0.06) 100%);
    border: 1.5px solid rgba(205,127,50,0.4);
    animation: bronze-pulse 4s ease-in-out infinite, fadeInUp 0.6s ease 0.15s both;
  }
  .podium-you {
    border-color: rgba(108,99,255,0.7) !important;
    background: linear-gradient(160deg, rgba(108,99,255,0.12) 0%, rgba(56,189,248,0.06) 100%) !important;
  }
  .podium-crown {
    font-size: 24px;
    display: block;
    margin-bottom: 8px;
    animation: crown-float 2.5s ease-in-out infinite;
  }
  .podium-2 .podium-crown, .podium-3 .podium-crown { animation: none; }
  .podium-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    margin: 0 auto 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Orbitron', monospace;
    font-size: 18px;
    font-weight: 900;
    overflow: hidden;
  }
  .podium-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .podium-name {
    font-family: 'Orbitron', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 1px;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .podium-you-tag { font-size: 8px; color: #7c3aed; letter-spacing: 2px; display: block; margin-bottom: 4px; }
  .podium-xp { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 900; line-height: 1; }
  .podium-xp-label { font-size: 8px; color: #94a3b8; letter-spacing: 2px; margin-top: 2px; }
  .podium-level { font-size: 10px; color: #64748b; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0,0,0,0.06); }

  .lb-divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px; animation: fadeInUp 0.6s ease 0.3s both;
  }
  .lb-divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent); }
  .lb-divider-label { font-family: 'Orbitron', monospace; font-size: 9px; color: #94a3b8; letter-spacing: 3px; }

  .lb-table {
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    animation: fadeInUp 0.6s ease 0.35s both;
  }
  .lb-table-header {
    display: grid;
    grid-template-columns: 44px 1fr 72px 60px 72px;
    padding: 12px 16px;
    background: rgba(0,0,0,0.03);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    font-family: 'Orbitron', monospace;
    font-size: 8px;
    color: #94a3b8;
    letter-spacing: 1px;
  }
  .lb-row {
    display: grid;
    grid-template-columns: 44px 1fr 72px 60px 72px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.04);
    align-items: center;
    transition: background 0.2s ease;
    animation: rowSlide 0.4s ease both;
    border-left: 3px solid transparent;
    cursor: pointer;
  }
  .lb-row:last-child { border-bottom: none; }
  .lb-row:hover { background: rgba(124,58,237,0.04); }
  .lb-row-you {
    background: linear-gradient(90deg, rgba(108,99,255,0.06), rgba(56,189,248,0.03));
    border-left: 3px solid #7c3aed !important;
  }
  .lb-row-rank { font-family: 'Orbitron', monospace; font-weight: 900; }
  .lb-row-player { display: flex; align-items: center; gap: 8px; overflow: hidden; }
  .lb-row-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 900;
    flex-shrink: 0; overflow: hidden;
  }
  .lb-row-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .lb-row-name {
    font-weight: 700; font-size: 14px; color: #1e293b;
    display: flex; align-items: center; gap: 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .you-badge {
    font-family: 'Orbitron', monospace; font-size: 7px;
    background: rgba(108,99,255,0.12); border: 1px solid rgba(108,99,255,0.3);
    border-radius: 100px; padding: 2px 6px; color: #7c3aed;
    letter-spacing: 1px; flex-shrink: 0;
  }
  .lb-row-xp { font-family: 'Orbitron', monospace; font-weight: 900; text-align: right; color: #d97706; font-size: 13px; }
  .lb-row-streak { font-family: 'Orbitron', monospace; font-size: 12px; color: #ef4444; text-align: right; }
  .lb-row-level { font-size: 11px; color: #64748b; text-align: right; white-space: nowrap; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
  }
  .modal-sheet {
    background: #f8faff;
    border-radius: 28px 28px 0 0;
    width: 100%; max-width: 480px;
    padding: 0 0 40px;
    animation: modalIn 0.35s ease both;
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-handle {
    width: 40px; height: 4px; background: #e2e8f0;
    border-radius: 100px; margin: 12px auto 0;
  }

  .lb-loading { text-align: center; padding: 80px 20px; font-family: 'Orbitron', monospace; font-size: 13px; color: #7c3aed; letter-spacing: 4px; }
  .lb-empty { text-align: center; padding: 80px 20px; font-size: 15px; color: #94a3b8; }
`;

const levelNames = ["Initiate", "Apprentice", "Scholar", "Warrior", "Guardian", "Sage", "Master", "Legend"];
const levelIcons = ["⚔️", "🛡️", "📖", "🗡️", "🦅", "🔮", "👑", "🌟"];
const rankColors = ["#d97706", "#64748b", "#b45309"];
const rankIcons = ["🥇", "🥈", "🥉"];

const CATEGORY_COLORS = {
  deen: { label: "Deen", icon: "☪️", color: "#6366f1", bg: "#eef2ff" },
  duniya: { label: "Duniya", icon: "📚", color: "#0891b2", bg: "#ecfeff" },
  health: { label: "Health", icon: "💪", color: "#059669", bg: "#ecfdf5" },
};

function PlayerModal({ player, onClose, currentUserId }) {
  const [completedMissions, setCompletedMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isYou = player.id === currentUserId;
  const lvl = Math.min((player.level || 1) - 1, 7);
  const xpThresholds = [0, 100, 250, 500, 900, 1400, 2000, 2700];
  const level = player.level || 1;
  const xp = player.xp || 0;
  const nextLevelXP = xpThresholds[level] || 9999;
  const currentLevelXP = xpThresholds[level - 1] || 0;
  const progress = Math.min(100, Math.round((xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100));
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const snap = await getDocs(collection(db, "users", player.id, "completedMissions"));
        const todayMissions = snap.docs
          .filter(d => d.id.startsWith(today))
          .map(d => d.data());
        setCompletedMissions(todayMissions);
      } catch (e) {
        setCompletedMissions([]);
      }
      setLoading(false);
    };
    fetchMissions();
  }, [player.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Profile Header */}
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          margin: "16px 16px 0",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          position: "relative",
        }}>
          {isYou && (
            <div style={{
              position: "absolute", top: "12px", right: "12px",
              background: "rgba(255,255,255,0.2)", borderRadius: "100px",
              padding: "3px 10px", fontSize: "10px", color: "white", fontWeight: "700",
            }}>YOU</div>
          )}
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            margin: "0 auto 12px",
            border: "3px solid rgba(255,255,255,0.4)",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.2)",
            fontSize: "28px", fontWeight: "900", color: "white",
            fontFamily: "'Orbitron', monospace",
          }}>
            {player.photo
              ? <img src={player.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : player.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ color: "white", fontSize: "20px", fontWeight: "800", marginBottom: "2px" }}>
            {player.name?.split(" ")[0]}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
            {levelIcons[lvl]} {levelNames[lvl]}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", padding: "14px 16px 0" }}>
          {[
            { label: "XP", value: (player.xp || 0).toLocaleString(), icon: "⭐", color: "#d97706", bg: "#fff7ed" },
            { label: "STREAK", value: `${player.streak || 0} 🔥`, icon: "", color: "#ef4444", bg: "#fff1f2" },
            { label: "LEVEL", value: `LV${player.level || 1}`, icon: levelIcons[lvl], color: "#6366f1", bg: "#eef2ff" },
          ].map((s, i) => (
            <div key={i} style={{
              background: s.bg, borderRadius: "16px",
              padding: "14px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "10px", color: s.color, opacity: 0.7, fontWeight: "700", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{
            background: "white", borderRadius: "16px", padding: "14px 16px",
            border: "1px solid #e0e7ff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e1b4b" }}>Level Progress</span>
              <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700" }}>{progress}%</span>
            </div>
            <div style={{ background: "#eef2ff", borderRadius: "100px", height: "8px" }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                borderRadius: "100px", transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
              {nextLevelXP - xp} XP to next level
            </div>
          </div>
        </div>

        {/* Today's Completed Missions */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{
            background: "white", borderRadius: "16px", padding: "14px 16px",
            border: "1px solid #e0e7ff",
          }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e1b4b", marginBottom: "12px" }}>
              ✅ Today's Completed Tasks
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "12px" }}>Loading...</div>
            ) : completedMissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "13px" }}>
                No tasks completed today yet
              </div>
            ) : (
              completedMissions.map((m, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", background: "#f0fdf4",
                  borderRadius: "10px", marginBottom: "6px",
                  border: "1px solid #bbf7d0",
                }}>
                  <span style={{ fontSize: "16px" }}>✓</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e1b4b", flex: 1 }}>
                    {m.missionId || "Mission completed"}
                  </span>
                  <span style={{
                    background: "#fef3c7", border: "1px solid #fde68a",
                    borderRadius: "100px", padding: "2px 8px",
                    color: "#d97706", fontSize: "11px", fontWeight: "700",
                  }}>
                    +{m.xp || 0} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Close button */}
        <div style={{ padding: "14px 16px 0" }}>
          <button onClick={onClose} style={{
            width: "100%", padding: "14px",
            background: "#eef2ff", border: "1px solid #c7d2fe",
            borderRadius: "14px", color: "#6366f1",
            fontSize: "14px", fontWeight: "700", cursor: "pointer",
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  // ✅ Correctly placed inside Leaderboard where `players` state is available
  const podiumOrder = players.length >= 3 ? [players[1], players[0], players[2]] : [];
  const podiumRanks = [2, 1, 3];
  const podiumClasses = ["podium-2", "podium-1", "podium-3"];

  useEffect(() => {
    const loadData = async () => {
      const userSnap = await getDocs(collection(db, "users"));
      const currentUser = userSnap.docs.find(d => d.id === user.uid);
      if (!currentUser) { setLoading(false); return; }

      const groupIds = currentUser.data().groups || [];
      if (groupIds.length === 0) { setLoading(false); return; }

      const groupData = await Promise.all(
        groupIds.map(async (groupId) => {
          const gSnap = await getDoc(doc(db, "groups", groupId));
          return gSnap.exists() ? { id: gSnap.id, ...gSnap.data() } : null;
        })
      );
      const validGroups = groupData.filter(Boolean);
      setGroups(validGroups);

      const firstGroup = validGroups[0];
      if (firstGroup) {
        setActiveGroup(firstGroup.id);
        await loadGroupPlayers(firstGroup);
      }
      setLoading(false);
    };
    loadData();
  }, [user.uid]);

  const loadGroupPlayers = async (group) => {
    setLoading(true);
    const memberIds = group.members || [];
    const allUsers = await getDocs(collection(db, "users"));
    const data = allUsers.docs
      .filter(d => memberIds.includes(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .map((p, index) => ({ ...p, rank: index + 1 }));
    setPlayers(data);
    setLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="lb-wrap">

        {/* Header */}
        <div className="lb-header">
          <div className="lb-eyebrow">GROUP RANKINGS</div>
          <h2 className="lb-title">LEADERBOARD</h2>
          <p className="lb-subtitle">{players.length} WARRIORS COMPETING</p>
        </div>

        {/* Group Tabs */}
        {groups.length > 1 && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
            {groups.map(g => (
              <button key={g.id} onClick={async () => { setActiveGroup(g.id); await loadGroupPlayers(g); }} style={{
                flexShrink: 0, padding: "8px 16px",
                background: activeGroup === g.id ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "white",
                border: activeGroup === g.id ? "none" : "1px solid #e2e8f0",
                borderRadius: "100px",
                color: activeGroup === g.id ? "white" : "#64748b",
                fontSize: "12px", fontWeight: "700", cursor: "pointer",
                boxShadow: activeGroup === g.id ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
              }}>
                ⚔️ {g.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="lb-loading">LOADING...</div>
        ) : players.length === 0 ? (
          <div className="lb-empty">No players yet. Be the first! 🚀</div>
        ) : (
          <>
            {/* Podium */}
            {players.length >= 3 && players[0].xp > 0 && (
              <div className="lb-podium">
                {podiumOrder.map((p, i) => {
                  const actualRank = podiumRanks[i];
                  const isYou = p.id === user.uid;
                  const lvl = Math.min((p.level || 1) - 1, 7);
                  return (
                    <div
                      key={p.id}
                      className={`podium-card ${podiumClasses[i]}${isYou ? " podium-you" : ""}`}
                      onClick={() => setSelectedPlayer(p)}
                    >
                      <span className="podium-crown">{rankIcons[actualRank - 1]}</span>
                      <div className="podium-avatar" style={{
                        background: isYou ? "rgba(108,99,255,0.15)" : "rgba(0,0,0,0.06)",
                        color: rankColors[actualRank - 1],
                        border: `2px solid ${rankColors[actualRank - 1]}80`,
                      }}>
                        {p.photo ? <img src={p.photo} alt="" /> : p.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="podium-name">{p.name?.split(" ")[0].toUpperCase()}</div>
                      {isYou && <span className="podium-you-tag">◆ YOU</span>}
                      <div className="podium-xp" style={{ color: rankColors[actualRank - 1] }}>
                        {(p.xp || 0).toLocaleString()}
                      </div>
                      <div className="podium-xp-label">XP</div>
                      <div className="podium-level">{levelIcons[lvl]} {levelNames[lvl]}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Divider */}
            <div className="lb-divider">
              <div className="lb-divider-line" />
              <div className="lb-divider-label">ALL RANKINGS</div>
              <div className="lb-divider-line" />
            </div>

            {/* Table */}
            <div className="lb-table">
              <div className="lb-table-header">
                <div>#</div>
                <div>PLAYER</div>
                <div style={{ textAlign: "right" }}>XP</div>
                <div style={{ textAlign: "right" }}>🔥</div>
                <div style={{ textAlign: "right" }}>LEVEL</div>
              </div>

              {players.map((p, i) => {
                const isYou = p.id === user.uid;
                const lvl = Math.min((p.level || 1) - 1, 7);
                const hasXP = (p.xp || 0) > 0;
                return (
                  <div
                    key={p.id}
                    className={`lb-row${isYou ? " lb-row-you" : ""}`}
                    style={{ animationDelay: `${0.4 + i * 0.05}s` }}
                    onClick={() => setSelectedPlayer(p)}
                  >
                    <div className="lb-row-rank" style={{
                      fontSize: (i < 3 && hasXP) ? "18px" : "13px",
                      color: (i < 3 && hasXP) ? rankColors[i] : "#cbd5e1",
                    }}>
                      {(i < 3 && hasXP) ? rankIcons[i] : `#${i + 1}`}
                    </div>

                    <div className="lb-row-player">
                      <div className="lb-row-avatar" style={{
                        background: isYou ? "rgba(108,99,255,0.15)" : "rgba(0,0,0,0.05)",
                        border: isYou ? "2px solid rgba(108,99,255,0.4)" : "2px solid rgba(0,0,0,0.08)",
                        color: "#7c3aed",
                      }}>
                        {p.photo ? <img src={p.photo} alt="" /> : p.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="lb-row-name" style={{ color: isYou ? "#7c3aed" : "#1e293b" }}>
                        {p.name?.split(" ")[0]}
                        {isYou && <span className="you-badge">YOU</span>}
                      </div>
                    </div>

                    <div className="lb-row-xp" style={{ color: hasXP ? "#d97706" : "#cbd5e1" }}>
                      {(p.xp || 0).toLocaleString()}
                    </div>

                    <div className="lb-row-streak" style={{ color: (p.streak || 0) > 0 ? "#ef4444" : "#cbd5e1" }}>
                      {(p.streak || 0) > 0 ? `🔥${p.streak}` : "—"}
                    </div>

                    <div className="lb-row-level">
                      {levelIcons[lvl]} LV{p.level || 1}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              textAlign: "center", marginTop: "12px",
              fontSize: "11px", color: "#94a3b8", fontWeight: "600",
            }}>
              👆 Tap any player to view their profile
            </div>
          </>
        )}
      </div>

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          currentUserId={user.uid}
        />
      )}
    </>
  );
}

export default Leaderboard;