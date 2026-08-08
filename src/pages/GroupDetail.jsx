import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addMissionToGroup, removeMissionFromGroup, startChallenge,
  saveVoiceNote, getVoiceNotes, markVoiceNoteHeard, hasHeardVoiceNote
} from "../firebase/db";
import { db, storage } from "../firebase";
import { doc, onSnapshot, collection, query, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORY_COLORS = {
  deen:   { color: "#6366f1", glow: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.2)",  bg: "#eef2ff", icon: "☪️" },
  duniya: { color: "#0891b2", glow: "rgba(8,145,178,0.06)",   border: "rgba(8,145,178,0.2)",   bg: "#ecfeff", icon: "📚" },
  health: { color: "#059669", glow: "rgba(5,150,105,0.06)",   border: "rgba(5,150,105,0.2)",   bg: "#ecfdf5", icon: "💪" },
};

function formatDuration(sec) {
  if (!sec) return "0s";
  return sec < 60 ? `${Math.round(sec)}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [newMission, setNewMission] = useState({ title: "", xp: 20, category: "deen" });
  const [expandedAdd, setExpandedAdd] = useState(null);

  // Voice note states
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [showVoiceSection, setShowVoiceSection] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRefs = useRef({});

  const showMsg = (text, error = false) => {
    setMessage({ text, error });
    setTimeout(() => setMessage(null), 3000);
  };

  // Listen to group doc
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = onSnapshot(doc(db, "groups", groupId), async (snap) => {
      if (!snap.exists()) { navigate("/groups"); return; }
      const data = { id: snap.id, ...snap.data() };
      setGroup(data);
      setLoading(false);

      const memberData = await Promise.all(
        data.members.map(async (uid) => {
          const userSnap = await getDocs(query(collection(db, "users")));
          const found = userSnap.docs.find(d => d.id === uid);
          return found ? { id: found.id, ...found.data() } : null;
        })
      );
      setMembers(memberData.filter(Boolean));
    });
    return unsubscribe;
  }, [groupId]);

  // Load voice notes
  useEffect(() => {
    if (!groupId) return;
    loadVoiceNotes();
  }, [groupId]);

  const loadVoiceNotes = async () => {
    const notes = await getVoiceNotes(groupId);
    setVoiceNotes(notes);
  };

  const isAdmin = group?.adminId === user.uid;

  // Check if latest voice note is unheard
  const hasNewVoiceNote = () => {
    if (!group?.lastVoiceNote?.id) return false;
    return !hasHeardVoiceNote(groupId, group.lastVoiceNote.id);
  };

  // ── RECORDING ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioURL(null);

      // Auto stop at 10 seconds
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 9) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      showMsg("Microphone access denied!", true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
  };

  // ── UPLOAD ──
 const handleUpload = async () => {
  if (!audioBlob) return;
  setUploading(true);
  showMsg("⏳ Uploading... please wait");
  try {
    const fileName = `voice_notes/${groupId}/${Date.now()}.webm`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, audioBlob);
    const downloadURL = await getDownloadURL(storageRef);
    await saveVoiceNote(groupId, user.uid, user.displayName, downloadURL, recordingTime);
    showMsg("Voice note sent! 🎙️");
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    await loadVoiceNotes();
  } catch (err) {
    showMsg("Upload failed. Try again.", true);
  }
  setUploading(false);
};
  // ── PLAYBACK ──
  const handlePlay = (noteId, url) => {
    // Stop any currently playing
    Object.values(audioRefs.current).forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });

    if (playingId === noteId) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(url);
    audioRefs.current[noteId] = audio;
    audio.play();
    setPlayingId(noteId);
    markVoiceNoteHeard(groupId, noteId);

    audio.onended = () => setPlayingId(null);
  };

  const isAdmin2 = group?.adminId === user.uid;

  const handleAddMission = async (category) => {
    if (!newMission.title.trim()) { showMsg("Enter mission title!", true); return; }
    const result = await addMissionToGroup(groupId, category, {
      title: newMission.title.trim(),
      xp: parseInt(newMission.xp) || 20,
    });
    if (result.success) {
      showMsg("Mission added! ✅");
      setNewMission({ title: "", xp: 20, category: "deen" });
      setExpandedAdd(null);
    }
  };

  const handleRemoveMission = async (category, missionId) => {
    if (!confirm("Remove this mission?")) return;
    await removeMissionFromGroup(groupId, category, missionId);
    showMsg("Mission removed!");
  };

  const handleStartChallenge = async () => {
    const total = ["deen", "duniya", "health"].reduce((a, c) => a + (group.missions?.[c]?.length || 0), 0);
    if (total === 0) { showMsg("Add at least 1 mission before starting!", true); return; }
    if (!confirm("Start the 30-day challenge? Members can begin completing missions.")) return;
    await startChallenge(groupId);
    showMsg("Challenge started! 🔥");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", color: "#6366f1", fontFamily: "'Orbitron',monospace" }}>
      LOADING...
    </div>
  );

  const newVoiceNote = hasNewVoiceNote();

  return (
    <div style={{ padding: "20px 16px 100px", background: "#EEF2FF", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Back button */}
        <button onClick={() => navigate("/groups")} style={{
          background: "white", border: "1px solid #e2e8f0",
          borderRadius: "10px", color: "#64748b", padding: "8px 16px",
          cursor: "pointer", fontSize: "12px", fontWeight: "700",
          marginBottom: "20px", letterSpacing: "1px",
        }}>
          ← BACK
        </button>

        {/* Group Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07))",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "24px", padding: "24px", marginBottom: "16px",
          boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#7c3aed", letterSpacing: "3px", marginBottom: "8px", fontWeight: "700" }}>
                ◆ {group.subject?.toUpperCase()}
              </div>
              <h2 style={{ fontFamily: "'Orbitron',monospace", fontSize: "22px", fontWeight: "900", color: "#1e1b4b", marginBottom: "6px" }}>
                {group.name}
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                {group.members.length} members · Created by {group.adminName}
              </p>
            </div>
            <span style={{
              background: group.status === "active" ? "rgba(5,150,105,0.1)" : "rgba(251,191,36,0.1)",
              border: `1px solid ${group.status === "active" ? "rgba(5,150,105,0.3)" : "rgba(251,191,36,0.3)"}`,
              borderRadius: "100px", padding: "6px 16px",
              color: group.status === "active" ? "#059669" : "#d97706",
              fontSize: "10px", fontWeight: "700", letterSpacing: "1px", whiteSpace: "nowrap",
            }}>
              {group.status?.toUpperCase()}
            </span>
          </div>

          {/* Invite Code */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginTop: "20px",
            background: "rgba(255,255,255,0.6)", borderRadius: "12px", padding: "12px 16px",
            border: "1px solid rgba(99,102,241,0.15)",
          }}>
            <span style={{ color: "#94a3b8", fontSize: "10px", fontWeight: "700", letterSpacing: "2px" }}>INVITE CODE</span>
            <span style={{ color: "#6366f1", fontSize: "20px", fontFamily: "'Orbitron',monospace", fontWeight: "900", letterSpacing: "4px", flex: 1 }}>
              {group.inviteCode}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => { navigator.clipboard.writeText(group.inviteCode); showMsg("Code copied! 📋"); }} style={{
                padding: "6px 12px", background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px",
                color: "#6366f1", fontSize: "11px", cursor: "pointer", fontWeight: "700",
              }}>COPY</button>
              <button onClick={() => { const link = `${window.location.origin}/join/${group.inviteCode}`; navigator.clipboard.writeText(link); showMsg("Invite link copied! 🔗"); }} style={{
                padding: "6px 12px", background: "rgba(5,150,105,0.1)",
                border: "1px solid rgba(5,150,105,0.3)", borderRadius: "8px",
                color: "#059669", fontSize: "11px", cursor: "pointer", fontWeight: "700",
              }}>🔗 SHARE</button>
            </div>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div style={{
            padding: "12px 20px", marginBottom: "16px",
            background: message.error ? "#fff1f2" : "#f0fdf4",
            border: `1px solid ${message.error ? "#fecdd3" : "#bbf7d0"}`,
            borderRadius: "12px", color: message.error ? "#ef4444" : "#059669",
            fontSize: "13px", fontWeight: "700",
          }}>
            {message.text}
          </div>
        )}

        {/* ── VOICE NOTE SECTION ── */}
        <div style={{
          background: "white", borderRadius: "24px", marginBottom: "16px",
          border: newVoiceNote ? "2px solid #f97316" : "1px solid #e0e7ff",
          boxShadow: newVoiceNote ? "0 4px 20px rgba(249,115,22,0.15)" : "0 2px 12px rgba(99,102,241,0.06)",
          overflow: "hidden",
        }}>
          {/* Voice Section Header */}
          <button
            onClick={() => {
              setShowVoiceSection(!showVoiceSection);
              if (!showVoiceSection && group?.lastVoiceNote?.id) {
                markVoiceNoteHeard(groupId, group.lastVoiceNote.id);
              }
            }}
            style={{
              width: "100%", padding: "18px 20px",
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "12px",
              textAlign: "left",
            }}
          >
            <div style={{
              width: "42px", height: "42px", borderRadius: "14px",
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
            }}>
              🎙️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#1e1b4b" }}>
                  Voice Reminders
                </span>
                {newVoiceNote && (
                  <span style={{
                    background: "#f97316", color: "white",
                    fontSize: "9px", fontWeight: "800", letterSpacing: "1px",
                    padding: "2px 8px", borderRadius: "100px",
                    animation: "pulse 1.5s infinite",
                  }}>NEW</span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                {voiceNotes.length > 0
                  ? `${voiceNotes.length} note${voiceNotes.length > 1 ? "s" : ""} · Latest ${timeAgo(group?.lastVoiceNote?.createdAt)}`
                  : isAdmin ? "Record a voice reminder for your group" : "No voice reminders yet"
                }
              </p>
            </div>
            <span style={{ color: "#94a3b8", fontSize: "18px", transform: showVoiceSection ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }}>
              ⌄
            </span>
          </button>

          {/* Expanded Voice Section */}
          {showVoiceSection && (
            <div style={{ padding: "0 20px 20px" }}>

              {/* Admin: Recording UI */}
              {isAdmin && (
                <div style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(239,68,68,0.04))",
                  border: "1px solid rgba(249,115,22,0.2)",
                  borderRadius: "18px", padding: "20px", marginBottom: "16px",
                }}>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#c2410c", letterSpacing: "1px", marginBottom: "14px" }}>
                    🎙️ RECORD DAILY REMINDER (MAX 10s)
                  </p>

                  {/* Not recording, no preview */}
                  {!recording && !audioURL && (
                    <button
                      onClick={startRecording}
                      style={{
                        width: "100%", padding: "14px",
                        background: "linear-gradient(135deg, #f97316, #ef4444)",
                        border: "none", borderRadius: "14px", color: "white",
                        fontSize: "14px", fontWeight: "700", cursor: "pointer",
                        boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>⏺</span> Hold to Record
                    </button>
                  )}

                  {/* Recording in progress */}
                  {recording && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        width: "80px", height: "80px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #f97316, #ef4444)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                        boxShadow: "0 0 0 8px rgba(249,115,22,0.2), 0 0 0 16px rgba(249,115,22,0.1)",
                        animation: "pulse 1s infinite",
                      }}>
                        <span style={{ fontSize: "32px" }}>🎙️</span>
                      </div>
                      <p style={{ color: "#ef4444", fontWeight: "800", fontSize: "28px", marginBottom: "4px" }}>
                        {recordingTime}s
                      </p>
                      <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "16px" }}>
                        {10 - recordingTime}s remaining
                      </p>
                      {/* Progress bar */}
                      <div style={{ background: "#fee2e2", borderRadius: "100px", height: "6px", marginBottom: "16px" }}>
                        <div style={{
                          width: `${(recordingTime / 10) * 100}%`,
                          height: "100%", background: "linear-gradient(90deg, #f97316, #ef4444)",
                          borderRadius: "100px", transition: "width 1s linear",
                        }} />
                      </div>
                      <button
                        onClick={stopRecording}
                        style={{
                          padding: "12px 32px",
                          background: "#fff1f2", border: "2px solid #fecdd3",
                          borderRadius: "12px", color: "#ef4444",
                          fontSize: "13px", fontWeight: "700", cursor: "pointer",
                        }}
                      >
                        ⏹ Stop Recording
                      </button>
                    </div>
                  )}

                  {/* Preview recorded audio */}
                  {!recording && audioURL && (
                    <div>
                      <div style={{
                        background: "white", borderRadius: "14px", padding: "14px",
                        border: "1px solid #fed7aa", marginBottom: "12px",
                        display: "flex", alignItems: "center", gap: "12px",
                      }}>
                        <button
                          onClick={() => handlePlay("preview", audioURL)}
                          style={{
                            width: "44px", height: "44px", borderRadius: "50%",
                            background: playingId === "preview"
                              ? "linear-gradient(135deg, #ef4444, #dc2626)"
                              : "linear-gradient(135deg, #f97316, #ef4444)",
                            border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "18px", boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                            flexShrink: 0,
                          }}
                        >
                          {playingId === "preview" ? "⏸" : "▶️"}
                        </button>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e1b4b" }}>Preview Recording</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>{recordingTime}s · Ready to send</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={discardRecording}
                          style={{
                            flex: 1, padding: "12px",
                            background: "#fff1f2", border: "1px solid #fecdd3",
                            borderRadius: "12px", color: "#ef4444",
                            fontSize: "13px", fontWeight: "700", cursor: "pointer",
                          }}
                        >
                          🗑 Discard
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={uploading}
                          style={{
                            flex: 2, padding: "12px",
                            background: uploading ? "#e5e7eb" : "linear-gradient(135deg, #f97316, #ef4444)",
                            border: "none", borderRadius: "12px", color: uploading ? "#9ca3af" : "white",
                            fontSize: "13px", fontWeight: "700", cursor: uploading ? "not-allowed" : "pointer",
                            boxShadow: uploading ? "none" : "0 4px 12px rgba(249,115,22,0.3)",
                          }}
                        >
                          {uploading ? "⏳ Uploading..." : "📤 Send to Group"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voice Notes List */}
              {voiceNotes.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "24px",
                  background: "#f8fafc", borderRadius: "14px",
                  border: "1px dashed #e2e8f0",
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎙️</div>
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                    {isAdmin ? "Record your first voice reminder above!" : "Admin hasn't sent a voice reminder yet."}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", letterSpacing: "1px", marginBottom: "10px" }}>
                    RECENT REMINDERS
                  </p>
                  {voiceNotes.map((note, i) => {
                    const isNew = i === 0 && !hasHeardVoiceNote(groupId, note.id);
                    const isPlaying = playingId === note.id;
                    return (
                      <div key={note.id} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "14px", marginBottom: "8px",
                        background: isNew ? "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(239,68,68,0.04))" : "#f8fafc",
                        borderRadius: "16px",
                        border: isNew ? "1px solid rgba(249,115,22,0.25)" : "1px solid #e2e8f0",
                      }}>
                        {/* Play Button */}
                        <button
                          onClick={() => handlePlay(note.id, note.url)}
                          style={{
                            width: "48px", height: "48px", borderRadius: "50%",
                            background: isPlaying
                              ? "linear-gradient(135deg, #ef4444, #dc2626)"
                              : "linear-gradient(135deg, #f97316, #ef4444)",
                            border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "18px", flexShrink: 0,
                            boxShadow: isPlaying
                              ? "0 0 0 4px rgba(239,68,68,0.2)"
                              : "0 2px 8px rgba(249,115,22,0.3)",
                          }}
                        >
                          {isPlaying ? "⏸" : "▶️"}
                        </button>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e1b4b" }}>
                              {note.adminName?.split(" ")[0]}'s Reminder
                            </p>
                            {isNew && (
                              <span style={{
                                background: "#f97316", color: "white",
                                fontSize: "8px", fontWeight: "800",
                                padding: "1px 6px", borderRadius: "100px",
                              }}>NEW</span>
                            )}
                          </div>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {formatDuration(note.duration)} · {timeAgo(note.createdAt?.toDate?.() || note.createdAt)}
                          </p>

                          {/* Waveform-style visual */}
                          {isPlaying && (
                            <div style={{ display: "flex", alignItems: "center", gap: "2px", marginTop: "6px" }}>
                              {[...Array(12)].map((_, i) => (
                                <div key={i} style={{
                                  width: "3px",
                                  height: `${8 + Math.sin(i * 0.8) * 8}px`,
                                  background: "#f97316",
                                  borderRadius: "2px",
                                  animation: `wave ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                                }} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Members */}
        <div style={{
          background: "white", border: "1px solid #e0e7ff",
          borderRadius: "20px", padding: "20px", marginBottom: "16px",
          boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
        }}>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", letterSpacing: "2px", marginBottom: "16px" }}>
            👥 MEMBERS ({members.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {members.map(m => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: m.id === group.adminId ? "#eef2ff" : "#f8fafc",
                borderRadius: "12px", padding: "8px 14px",
                border: m.id === group.adminId ? "1px solid rgba(99,102,241,0.3)" : "1px solid #e2e8f0",
              }}>
                {m.photo ? (
                  <img src={m.photo} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "rgba(99,102,241,0.15)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#6366f1", fontWeight: "900", fontSize: "12px",
                  }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span style={{ color: "#1e1b4b", fontSize: "13px", fontWeight: "600" }}>
                  {m.name?.split(" ")[0]}
                </span>
                {m.id === group.adminId && (
                  <span style={{
                    fontSize: "8px", color: "#6366f1", fontWeight: "700",
                    letterSpacing: "1px", background: "rgba(99,102,241,0.1)",
                    padding: "2px 6px", borderRadius: "100px",
                  }}>ADMIN</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin notice */}
        {isAdmin2 && group.status === "active" && (
          <div style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "14px", padding: "12px 16px",
            marginBottom: "16px", fontSize: "12px",
            color: "#6366f1", fontWeight: "600",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            ⚙️ <span><strong>Admin Mode:</strong> You can add or remove missions even while the challenge is active.</span>
          </div>
        )}

        {/* Missions by Category */}
        {["deen", "duniya", "health"].map(cat => {
          const c = CATEGORY_COLORS[cat];
          const missions = group.missions?.[cat] || [];
          const isExpanded = expandedAdd === cat;

          return (
            <div key={cat} style={{
              background: "white", border: `1px solid ${c.border}`,
              borderRadius: "20px", padding: "20px", marginBottom: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: c.bg, borderRadius: "10px", padding: "7px 14px",
                  border: `1px solid ${c.border}`,
                }}>
                  <span style={{ fontSize: "14px" }}>{c.icon}</span>
                  <span style={{ fontSize: "12px", color: c.color, fontWeight: "700", letterSpacing: "1px" }}>
                    {cat.toUpperCase()} MISSIONS
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    color: "#64748b", fontSize: "12px", fontWeight: "600",
                    background: "#f8fafc", borderRadius: "100px",
                    padding: "4px 12px", border: "1px solid #e2e8f0",
                  }}>
                    {missions.length} tasks
                  </span>
                  {isAdmin2 && (
                    <button
                      onClick={() => setExpandedAdd(isExpanded ? null : cat)}
                      style={{
                        padding: "6px 14px",
                        background: isExpanded ? "#fff1f2" : c.bg,
                        border: `1px solid ${isExpanded ? "#fecdd3" : c.border}`,
                        borderRadius: "100px",
                        color: isExpanded ? "#ef4444" : c.color,
                        fontSize: "12px", fontWeight: "700", cursor: "pointer",
                      }}
                    >
                      {isExpanded ? "✕ Cancel" : "+ Add"}
                    </button>
                  )}
                </div>
              </div>

              {missions.length === 0 ? (
                <div style={{
                  color: "#94a3b8", fontSize: "13px", textAlign: "center",
                  padding: "20px", background: "#f8fafc", borderRadius: "12px",
                  border: "1px dashed #e2e8f0",
                }}>
                  No missions yet
                </div>
              ) : (
                missions.map(m => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 16px", marginBottom: "8px",
                    background: c.bg, borderRadius: "12px",
                    border: `1px solid ${c.border}`,
                  }}>
                    <div style={{ flex: 1, color: "#1e1b4b", fontWeight: "600", fontSize: "14px" }}>{m.title}</div>
                    <div style={{
                      background: "#fef3c7", border: "1px solid #fde68a",
                      borderRadius: "100px", padding: "3px 10px",
                      color: "#d97706", fontSize: "11px", fontWeight: "700",
                    }}>
                      +{m.xp} XP
                    </div>
                    {isAdmin2 && (
                      <button onClick={() => handleRemoveMission(cat, m.id)} style={{
                        background: "#fff1f2", border: "1px solid #fecdd3",
                        borderRadius: "8px", color: "#ef4444", padding: "4px 10px",
                        cursor: "pointer", fontSize: "12px", fontWeight: "700",
                      }}>✕</button>
                    )}
                  </div>
                ))
              )}

              {isAdmin2 && isExpanded && (
                <div style={{
                  marginTop: "12px", padding: "14px",
                  background: c.bg, borderRadius: "14px",
                  border: `1px dashed ${c.border}`,
                }}>
                  <div style={{ fontSize: "11px", color: c.color, fontWeight: "700", marginBottom: "10px", letterSpacing: "1px" }}>
                    ＋ NEW {cat.toUpperCase()} MISSION
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      placeholder="Mission title..."
                      value={newMission.category === cat ? newMission.title : ""}
                      onChange={e => setNewMission({ ...newMission, title: e.target.value, category: cat })}
                      style={{
                        flex: 1, minWidth: "160px", padding: "10px 14px",
                        background: "white", border: `1px solid ${c.border}`,
                        borderRadius: "10px", color: "#1e1b4b",
                        fontSize: "13px", outline: "none",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    />
                    <input
                      type="number" placeholder="XP"
                      value={newMission.category === cat ? newMission.xp : 20}
                      onChange={e => setNewMission({ ...newMission, xp: e.target.value, category: cat })}
                      style={{
                        width: "70px", padding: "10px 14px",
                        background: "white", border: `1px solid ${c.border}`,
                        borderRadius: "10px", color: "#1e1b4b",
                        fontSize: "13px", outline: "none",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    />
                    <button onClick={() => handleAddMission(cat)} style={{
                      padding: "10px 20px", background: c.color,
                      border: "none", borderRadius: "10px", color: "white",
                      fontSize: "13px", fontWeight: "700", cursor: "pointer",
                      boxShadow: `0 4px 12px ${c.border}`,
                    }}>
                      Add ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Start Challenge */}
        {isAdmin2 && group.status === "waiting" && (
          <button onClick={handleStartChallenge} style={{
            width: "100%", padding: "16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: "16px", color: "white",
            fontSize: "14px", fontWeight: "700", cursor: "pointer",
            letterSpacing: "1px", marginTop: "8px",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}>
            🚀 START 30-DAY CHALLENGE
          </button>
        )}

        {group.status === "active" && (
          <div style={{
            textAlign: "center", padding: "16px",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "16px", color: "#059669",
            fontSize: "13px", fontWeight: "700", letterSpacing: "1px",
            marginTop: "8px",
          }}>
            🔥 CHALLENGE IS ACTIVE — MEMBERS ARE COMPLETING MISSIONS!
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.97); }
        }
        @keyframes wave {
          from { transform: scaleY(0.6); }
          to { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

export default GroupDetail;
