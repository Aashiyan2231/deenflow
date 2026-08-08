import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, getUserById } from "../firebase/db";

function Profile() {
  const { user, logout } = useAuth();
  const { userData } = useUser();
  const [friendCode, setFriendCode] = useState("");
  const [message, setMessage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const xp = userData?.xp || 0;
  const level = userData?.level || 1;
  const streak = userData?.streak || 0;
  const xpThresholds = [0, 100, 250, 500, 900, 1400, 2000, 2700];
  const nextLevelXP = xpThresholds[level] || 9999;
  const currentLevelXP = xpThresholds[level - 1] || 0;
  const progress = Math.min(100, Math.round((xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100));
  const levelNames = ["Initiate", "Apprentice", "Scholar", "Warrior", "Guardian", "Sage", "Master", "Legend"];
  const levelIcons = ["⚔️","🛡️","📖","🗡️","🦅","🔮","👑","🌟"];

  useEffect(() => {
    if (!userData?.receivedRequests?.length) { setRequests([]); return; }
    Promise.all(userData.receivedRequests.map(id => getUserById(id)))
      .then(data => setRequests(data.filter(Boolean)));
  }, [userData?.receivedRequests]);

  useEffect(() => {
    if (!userData?.friends?.length) { setFriends([]); return; }
    Promise.all(userData.friends.map(id => getUserById(id)))
      .then(data => setFriends(data.filter(Boolean)));
  }, [userData?.friends]);

  const handleSendRequest = async () => {
    if (!friendCode.trim()) return;
    const result = await sendFriendRequest(user, friendCode.trim());
    setMessage(result.error || result.success);
    setFriendCode("");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAccept = async (friendId) => {
    await acceptFriendRequest(user.uid, friendId);
    setMessage("Friend added! 🎉");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDecline = async (friendId) => {
    await declineFriendRequest(user.uid, friendId);
  };

  if (!userData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
      <div style={{ fontSize: "40px" }}>⏳</div>
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px", background: "#EEF2FF", minHeight: "100vh" }}>

      {/* Profile Card */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
        borderRadius: "28px", padding: "28px 20px",
        marginBottom: "16px", textAlign: "center",
        boxShadow: "0 12px 40px rgba(99,102,241,0.3)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-20px", left: "20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />

        <img src={user.photoURL} alt="avatar" style={{
          width: "80px", height: "80px", borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.5)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          marginBottom: "12px", position: "relative", zIndex: 1,
        }} />
        <h2 style={{ color: "white", fontSize: "22px", fontWeight: "800", marginBottom: "4px", position: "relative", zIndex: 1 }}>
          {user.displayName}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "16px", position: "relative", zIndex: 1 }}>
          {user.email}
        </p>

        {/* Friend Code */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
          borderRadius: "12px", padding: "8px 16px",
          border: "1px solid rgba(255,255,255,0.3)",
          position: "relative", zIndex: 1,
        }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: "600" }}>YOUR CODE</span>
          <span style={{ color: "white", fontSize: "16px", fontWeight: "800", letterSpacing: "2px" }}>
            {userData.friendCode || "------"}
          </span>
        </div>
      </div>

      {/* Level & XP */}
      <div style={{
        background: "white", borderRadius: "24px", padding: "20px",
        marginBottom: "12px", boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
        border: "1px solid #e0e7ff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px",
          }}>
            {levelIcons[level - 1]}
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b" }}>
              Level {level} — {levelNames[level - 1]}
            </p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>
              {nextLevelXP - xp} XP to next level
            </p>
          </div>
          <div style={{
            marginLeft: "auto",
            background: "#eef2ff", borderRadius: "100px",
            padding: "6px 14px", color: "#6366f1",
            fontSize: "13px", fontWeight: "800",
          }}>
            {xp} XP
          </div>
        </div>
        <div style={{ background: "#eef2ff", borderRadius: "100px", height: "10px" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: "100px", transition: "width 0.8s ease",
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        {[
          { label: "Total XP", value: xp, icon: "⭐", bg: "#fff7ed", color: "#d97706" },
          { label: "Streak", value: `${streak} 🔥`, icon: "", bg: "#fff1f2", color: "#dc2626" },
          { label: "Level", value: level, icon: "🏅", bg: "#f0fdf4", color: "#16a34a" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: stat.bg, borderRadius: "18px",
            padding: "16px 10px", textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{stat.icon}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: stat.color, opacity: 0.7 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Add Friend */}
      <div style={{
        background: "white", borderRadius: "24px", padding: "20px",
        marginBottom: "12px", boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
        border: "1px solid #e0e7ff",
      }}>
        <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b", marginBottom: "12px" }}>
          ➕ Add Friend
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={friendCode}
            onChange={e => setFriendCode(e.target.value.toUpperCase())}
            placeholder="Enter friend code..."
            maxLength={8}
            style={{
              flex: 1, padding: "11px 14px",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: "12px", color: "#1e1b4b",
              fontSize: "14px", fontWeight: "700",
              letterSpacing: "1px", outline: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <button onClick={handleSendRequest} style={{
            padding: "11px 20px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: "12px", color: "white",
            fontSize: "13px", fontWeight: "700", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Send
          </button>
        </div>
        {message && (
          <div style={{
            marginTop: "10px", padding: "10px 14px",
            background: message.includes("sent") || message.includes("added") ? "#f0fdf4" : "#fff1f2",
            border: `1px solid ${message.includes("sent") || message.includes("added") ? "#bbf7d0" : "#fecdd3"}`,
            borderRadius: "10px",
            color: message.includes("sent") || message.includes("added") ? "#16a34a" : "#dc2626",
            fontSize: "13px", fontWeight: "600",
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Friend Requests */}
      {requests.length > 0 && (
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: "24px", padding: "20px", marginBottom: "12px",
        }}>
          <p style={{ fontSize: "15px", fontWeight: "800", color: "#92400e", marginBottom: "12px" }}>
            🔔 Friend Requests ({requests.length})
          </p>
          {requests.map(req => (
            <div key={req.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px", background: "white",
              borderRadius: "14px", marginBottom: "8px",
            }}>
              {req.photo ? (
                <img src={req.photo} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%" }} />
              ) : (
                <div style={{
                  width: "38px", height: "38px", borderRadius: "50%",
                  background: "#fed7aa", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#d97706", fontWeight: "800",
                }}>
                  {req.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e1b4b" }}>{req.name}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>Level {req.level} · {req.xp} XP</p>
              </div>
              <button onClick={() => handleAccept(req.id)} style={{
                padding: "7px 14px", background: "#f0fdf4",
                border: "1px solid #bbf7d0", borderRadius: "10px",
                color: "#16a34a", fontSize: "12px", fontWeight: "700", cursor: "pointer",
              }}>✓</button>
              <button onClick={() => handleDecline(req.id)} style={{
                padding: "7px 14px", background: "#fff1f2",
                border: "1px solid #fecdd3", borderRadius: "10px",
                color: "#ef4444", fontSize: "12px", fontWeight: "700", cursor: "pointer",
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div style={{
        background: "white", borderRadius: "24px", padding: "20px",
        marginBottom: "12px", boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
        border: "1px solid #e0e7ff",
      }}>
        <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b", marginBottom: "12px" }}>
          👥 Friends ({friends.length})
        </p>
        {friends.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "16px" }}>
            No friends yet — share your code!
          </p>
        ) : (
          friends.map(f => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px", background: "#f8fafc",
              borderRadius: "14px", marginBottom: "8px",
              border: "1px solid #e2e8f0",
            }}>
              {f.photo ? (
                <img src={f.photo} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #c7d2fe" }} />
              ) : (
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: "#eef2ff", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#6366f1", fontWeight: "800",
                }}>
                  {f.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e1b4b" }}>{f.name}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>Level {f.level} · {f.xp} XP · 🔥{f.streak}</p>
              </div>
              <div style={{
                background: "#fef3c7", borderRadius: "100px",
                padding: "4px 12px", color: "#d97706",
                fontSize: "12px", fontWeight: "800",
              }}>
                {f.xp} XP
              </div>
            </div>
          ))
        )}
      </div>

      {/* Logout */}
      <button onClick={logout} style={{
        width: "100%", padding: "15px",
        background: "#fff1f2", border: "2px solid #fecdd3",
        borderRadius: "16px", color: "#ef4444",
        fontSize: "14px", fontWeight: "700", cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        🚪 Logout
      </button>

    </div>
  );
}

export default Profile;