import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinGroup } from "../firebase/db";

function JoinGroup() {
  const { inviteCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("joining"); // joining | success | error | already

  useEffect(() => {
    if (!user || !inviteCode) return;

    const doJoin = async () => {
      const result = await joinGroup(user, inviteCode.toUpperCase());
      if (result.error) {
        if (result.error.toLowerCase().includes("already")) {
          setStatus("already");
          setTimeout(() => navigate("/groups"), 2000);
        } else {
          setStatus("error");
          setTimeout(() => navigate("/groups"), 3000);
        }
      } else {
        setStatus("success");
        setTimeout(() => navigate(`/group/${result.groupId}`), 2000);
      }
    };

    doJoin();
  }, [user, inviteCode]);

  // If not logged in, show sign-in prompt (user needs to login first)
  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080B14",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "28px", padding: "40px 32px",
          textAlign: "center", maxWidth: "360px", width: "100%",
        }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔗</div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white", marginBottom: "8px" }}>
            You're invited!
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
            Sign in with Google to join this group
          </p>
          <div style={{
            padding: "8px 20px", background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "100px", display: "inline-block",
            color: "#818cf8", fontSize: "14px", fontWeight: "800", letterSpacing: "2px",
            marginBottom: "24px",
          }}>
            {inviteCode?.toUpperCase()}
          </div>
          <p style={{ fontSize: "12px", color: "#64748b" }}>
            Please sign in using the button above ↑
          </p>
        </div>
      </div>
    );
  }

  const messages = {
    joining: { icon: "⏳", title: "Joining group...",     color: "#6366f1", sub: "Please wait" },
    success: { icon: "🎉", title: "Joined successfully!", color: "#059669", sub: "Taking you to the group..." },
    already: { icon: "✅", title: "Already a member!",    color: "#0891b2", sub: "Taking you to the group..." },
    error:   { icon: "❌", title: "Invalid invite link",  color: "#dc2626", sub: "Redirecting to groups..." },
  };

  const m = messages[status];

  return (
    <div style={{
      minHeight: "100vh", background: "#EEF2FF",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "white", borderRadius: "28px", padding: "40px 32px",
        textAlign: "center", maxWidth: "360px", width: "100%",
        boxShadow: "0 8px 32px rgba(99,102,241,0.12)",
        border: "1px solid #e0e7ff",
      }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>{m.icon}</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1e1b4b", marginBottom: "8px" }}>
          {m.title}
        </h2>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>{m.sub}</p>
        <div style={{
          padding: "8px 20px", background: "#eef2ff",
          borderRadius: "100px", display: "inline-block",
          color: m.color, fontSize: "14px", fontWeight: "800", letterSpacing: "2px",
        }}>
          {inviteCode?.toUpperCase()}
        </div>

        {/* Spinner for joining state */}
        {status === "joining" && (
          <div style={{
            marginTop: "24px", width: "32px", height: "32px",
            border: "3px solid #e0e7ff", borderTop: "3px solid #6366f1",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
            margin: "24px auto 0",
          }} />
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default JoinGroup;
