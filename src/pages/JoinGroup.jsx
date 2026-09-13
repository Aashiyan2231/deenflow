import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinGroupByCode } from "../firebase/db";

function JoinGroup() {
  const { inviteCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("joining");

  useEffect(() => {
    if (!user || !inviteCode) return;

    const doJoin = async () => {
      const result = await joinGroupByCode(user, inviteCode.toUpperCase());
      if (result.error) {
        if (result.error.toLowerCase().includes("already")) {
          setStatus("already");
          setTimeout(() => navigate("/contest"), 2000);
        } else {
          setStatus("error");
          setTimeout(() => navigate("/contest"), 3000);
        }
      } else {
        setStatus("success");
        setTimeout(() => navigate(`/contests/${result.groupId}`), 2000);
      }
    };

    doJoin();
  }, [user, inviteCode]);

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0F0A1E",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "28px", padding: "40px 32px",
          textAlign: "center", maxWidth: "360px", width: "100%",
        }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔗</div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white", marginBottom: "8px" }}>
            You're invited!
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
            Enter your name to join this contest
          </p>
          <div style={{
            padding: "8px 20px", background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "100px", display: "inline-block",
            color: "#a78bfa", fontSize: "14px", fontWeight: "800", letterSpacing: "2px",
            marginBottom: "24px",
          }}>
            {inviteCode?.toUpperCase()}
          </div>
          <p style={{ fontSize: "12px", color: "#64748b" }}>
            Please enter your name on the login screen ↑
          </p>
        </div>
      </div>
    );
  }

  const messages = {
    joining: { icon: "⏳", title: "Joining contest...", color: "#8b5cf6", sub: "Please wait" },
    success: { icon: "🎉", title: "Joined successfully!", color: "#059669", sub: "Taking you to the contest..." },
    already: { icon: "✅", title: "Already a member!", color: "#0891b2", sub: "Taking you to the contest..." },
    error: { icon: "❌", title: "Invalid invite link", color: "#dc2626", sub: "Redirecting to contests..." },
  };

  const m = messages[status];

  return (
    <div style={{
      minHeight: "100vh", background: "#0F0A1E",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: "28px", padding: "40px 32px",
        textAlign: "center", maxWidth: "360px", width: "100%",
        boxShadow: "0 8px 32px rgba(139,92,246,0.15)",
      }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>{m.icon}</div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "white", marginBottom: "8px" }}>
          {m.title}
        </h2>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>{m.sub}</p>
        <div style={{
          padding: "8px 20px", background: "rgba(139,92,246,0.15)",
          borderRadius: "100px", display: "inline-block",
          color: m.color, fontSize: "14px", fontWeight: "800", letterSpacing: "2px",
        }}>
          {inviteCode?.toUpperCase()}
        </div>

        {status === "joining" && (
          <div style={{
            marginTop: "24px", width: "32px", height: "32px",
            border: "3px solid rgba(139,92,246,0.2)", borderTop: "3px solid #8b5cf6",
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