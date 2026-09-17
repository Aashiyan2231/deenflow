import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (mode === "signup" && name.trim().length < 2) {
      setError("Enter a display name with at least 2 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") await signUp(email, password, name);
      else await signIn(email, password);
    } catch (authError) {
      const messages = {
        "auth/email-already-in-use": "That email is already registered.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a stronger password.",
      };
      setError(messages[authError.code] || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.logo}>⚔️</div>
        <h1 style={styles.title}>StudyBattle</h1>
        <p style={styles.subtitle}>Learn deeply. Compete fairly.</p>
        <div style={styles.tabs}>
          <button type="button" style={mode === "login" ? styles.activeTab : styles.tab} onClick={() => { setMode("login"); setError(""); }}>Log in</button>
          <button type="button" style={mode === "signup" ? styles.activeTab : styles.tab} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
        </div>
        {mode === "signup" && <input style={styles.input} value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" autoComplete="name" />}
        <input style={styles.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" required />
        <input style={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.primary} disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Enter the arena" : "Create account"}</button>
        <p style={styles.footnote}>Your progress is saved to your account.</p>
      </form>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0F0A1E", display: "grid", placeItems: "center", padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  card: { width: "100%", maxWidth: 400, padding: 32, borderRadius: 24, background: "#160F26", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", textAlign: "center", display: "flex", flexDirection: "column", gap: 12 },
  logo: { fontSize: 48 },
  title: { color: "#F0F4FF", fontSize: 30, margin: 0 },
  subtitle: { color: "#a78bfa", fontSize: 14, margin: "0 0 10px" },
  tabs: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 },
  tab: { background: "transparent", border: "1px solid rgba(139,92,246,0.2)", color: "#6b7280", borderRadius: 10, padding: 10, cursor: "pointer" },
  activeTab: { background: "rgba(139,92,246,0.15)", border: "1px solid #8b5cf6", color: "#F0F4FF", borderRadius: 10, padding: 10, cursor: "pointer" },
  input: { width: "100%", padding: "13px 14px", background: "#0F0A1E", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 10, color: "#F0F4FF", outline: "none", fontSize: 14, fontFamily: "inherit" },
  primary: { padding: 14, background: "#8b5cf6", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", marginTop: 4 },
  error: { color: "#f87171", fontSize: 12, margin: 0 },
  footnote: { color: "#4b5563", fontSize: 11, margin: "4px 0 0" },
};
