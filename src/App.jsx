import Chat from "./pages/Chat.jsx";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home.jsx";
import Missions from "./pages/Missions.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Groups from "./pages/Groups.jsx";
import GroupDetail from "./pages/GroupDetail.jsx";
import JoinGroup from "./pages/JoinGroup.jsx";
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
      <Link to="/missions" className={path === "/missions" ? "active" : ""}>
        <span>⚔️</span>
        <span>Missions</span>
      </Link>
      <Link to="/groups" className={path === "/groups" || path.startsWith("/group/") ? "active" : ""}>
        <span>👥</span>
        <span>Groups</span>
      </Link>
      <Link to="/leaderboard" className={path === "/leaderboard" ? "active" : ""}>
        <span>🏆</span>
        <span>Ranks</span>
      </Link>
      <Link to="/profile" className={path === "/profile" ? "active" : ""}>
        <span>👤</span>
        <span>Profile</span>
      </Link>
      <Link to="/chat" className={path === "/chat" ? "active" : ""}>
  <span>💬</span>
  <span>Chat</span>
</Link>
    </nav>
  );
}

function AppInner() {
  const { user } = useAuth();
  const location = useLocation();

  // Allow /join/:inviteCode even when not logged in — Login will handle auth
  if (!user) {
    if (location.pathname.startsWith("/join/")) {
      return <JoinGroup />;
    }
    return <Login />;
  }

  return (
    <div className="app">
      {/* Top Navbar */}
      <header className="navbar">
        <h1>⚔️ DeenFlow</h1>
        <div className="profile">
          <img src={user.photoURL} className="avatar" alt="avatar" />
          <h3>{user.displayName?.split(" ")[0]}</h3>
        </div>
      </header>

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/group/:groupId" element={<GroupDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />
        <Route path="/chat" element={<Chat />} />

        
      </Routes>

      {/* Bottom Navigation */}
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
