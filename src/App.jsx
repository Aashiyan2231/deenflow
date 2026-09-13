import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Groups from "./pages/contest.jsx";
import GroupDetail from "./pages/Contestdetail.jsx";
import JoinGroup from "./pages/JoinGroup.jsx";
import Discover from "./pages/Discover.jsx";
import Badges from "./pages/Badges.jsx";
import "./App.css";

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={path === "/" ? "active" : ""}>
        <span>🏠</span>
        <span>Home</span>
      </Link>
      <Link to="/contest" className={path === "/contest" || path.startsWith("/contest/") || path.startsWith("/contests/") ? "active" : ""}>
        <span>👥</span>
        <span>Contests</span>
      </Link>
      <Link to="/discover" className={path === "/discover" ? "active" : ""}>
        <span>🔎</span>
        <span>Discover</span>
      </Link>
      <Link to="/leaderboard" className={path === "/leaderboard" ? "active" : ""}>
        <span>🏆</span>
        <span>Ranks</span>
      </Link>
      <Link to="/badges" className={path === "/badges" ? "active" : ""}>
        <span>🎖️</span>
        <span>Badges</span>
      </Link>
      <Link to="/profile" className={path === "/profile" ? "active" : ""}>
        <span>👤</span>
        <span>Profile</span>
      </Link>
    </nav>
  );
}

function AppInner() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (location.pathname.startsWith("/join/")) {
      return <JoinGroup />;
    }
    return <Login />;
  }

  return (
    <div className="app">
      <header className="navbar">
        <h1>⚔️ StudyBattle</h1>
        <div className="profile">
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "800", fontSize: "16px",
            border: "2px solid #8b5cf6",
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <h3>{user.name?.split(" ")[0]}</h3>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contest" element={<Groups />} />
        <Route path="/contests/:id" element={<GroupDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/badges" element={<Badges />} />
      </Routes>

      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;