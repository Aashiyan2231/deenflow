import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../hooks/useUser";
import { addTaskToGroup, addTasksFromPlaylist, endGroupChallenge, getGroupById, startGroupChallenge } from "../firebase/db";
import verifyNote from "../services/verifyNote";
import { fetchPlaylistVideos } from "../services/youtube";
import { generateQuestions, verifyAnswers } from "../services/quiz";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function ContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contests = [], activeContests = [], toggleContestTask, loading } = useUser();

  const [taskTitle, setTaskTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [taskXp, setTaskXp] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [winnerUid, setWinnerUid] = useState(null);
  const [noteTaskId, setNoteTaskId] = useState(null);
  const [userNote, setUserNote] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationResults, setVerificationResults] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [directContest, setDirectContest] = useState(null);
  const [gateCode, setGateCode] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [quizByTask, setQuizByTask] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizLoading, setQuizLoading] = useState(false);

  const all = [...contests, ...activeContests];
  const contest = all.find((c) => c.id === id) || directContest;

  useEffect(() => {
    if (loading || contests.some((item) => item.id === id) || activeContests.some((item) => item.id === id)) return undefined;
    let cancelled = false;
    getGroupById(id).then((group) => {
      if (!cancelled) setDirectContest(group);
    }).catch(() => {
      if (!cancelled) setDirectContest(null);
    });
    return () => { cancelled = true; };
  }, [id, loading, contests, activeContests]);

  useEffect(() => {
    if (!contest || !user || contest.adminId !== user.uid) return;
    const today = new Date().toISOString().slice(0, 10);
    if (contest.status === "waiting" && contest.startDate && contest.startDate <= today) {
      startGroupChallenge(id).catch(() => {});
    } else if (contest.status === "active" && contest.endDate && contest.endDate <= today) {
      endGroupChallenge(id).catch(() => {});
    }
  }, [contest, id, user]);

  useEffect(() => {
    if (loading || !contest || !(contest.members || []).includes(user?.uid)) return undefined;

    let cancelled = false;

    async function loadLeaderboard() {
      setLeaderboardLoading(true);
      try {
        const members = contest.members || [];
        const rows = await Promise.all(members.map(async (memberId) => {
          const [userSnap, attemptsSnap] = await Promise.all([
            getDoc(doc(db, "users", memberId)),
            getDocs(collection(db, "users", memberId, "completedMissions")),
          ]);
          const completed = attemptsSnap.docs.filter((attempt) =>
            attempt.id.includes(`_${id}_`)
          );
          const activeDays = new Set(
            completed.map((attempt) => attempt.id.split("_")[0])
          );
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            id: memberId,
            name: userData.name || userData.displayName || "Student",
            videosDone: completed.length,
            daysActive: activeDays.size,
          };
        }));
        rows.sort((a, b) => b.videosDone - a.videosDone || b.daysActive - a.daysActive);
        if (!cancelled) setLeaderboard(rows);
      } catch (e) {
        if (!cancelled) setLeaderboard([]);
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    }

    loadLeaderboard();
    return () => { cancelled = true; };
  }, [contest, id, loading, user?.uid]);

  if (loading) {
    return <div style={styles.page}><span style={{ color: "#4b5563" }}>Loading…</span></div>;
  }
  if (!contest) {
    return (
      <div style={styles.page}>
        <span style={{ color: "#4b5563" }}>Contest not found.</span>
      </div>
    );
  }

  const isMember = (contest.members || []).includes(user?.uid);
  if (!isMember && contest.visibility === "private") {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Private contest</h1>
        <p style={styles.subtitle}>This contest is private. Enter its invite code to join.</p>
        <input style={styles.input} value={gateCode} onChange={(event) => setGateCode(event.target.value.toUpperCase())} placeholder="Invite code" maxLength={6} />
        <button style={styles.primaryBtn} onClick={() => navigate(`/join/${gateCode}`)} disabled={gateCode.length < 6}>Join with invite code</button>
      </div>
    );
  }

  const isAdmin = contest.adminId === user?.uid;
  const tasks = contest.tasks || contest.missions?.tasks || [];
  const isEnded = contest.status === "ended" || Boolean(winnerUid);
  const completedTaskIds = new Set(contest.completedTaskIds || []);
  const firstUnlockedIndex = tasks.findIndex(
    (task) =>
      !completedTaskIds.has(task.id) &&
      verificationResults[task.id]?.verdict?.toUpperCase() !== "PASS"
  );

  async function handleAddTask() {
    if (!taskTitle.trim()) return;
    setBusy(true);
    setError("");
    try {
      await addTaskToGroup(id, {
        title: taskTitle.trim(),
        xp: Number(taskXp) || 0,
        videoUrl,
      });
      setTaskTitle("");
      setVideoUrl("");
      setTaskXp(20);
    } catch (e) {
      setError("Couldn't add the task.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      await startGroupChallenge(id);
    } catch (e) {
      setError("Couldn't start the contest.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImportPlaylist() {
    if (!contest.playlistUrl) {
      setError("Add a playlist URL to this contest first.");
      return;
    }
    setImportBusy(true);
    setError("");
    try {
      const videos = await fetchPlaylistVideos(contest.playlistUrl);
      if (!videos.length) throw new Error("No playable videos were found in that playlist.");
      await addTasksFromPlaylist(id, videos, taskXp);
      setVerificationMessage(`Imported ${videos.length} videos.`);
    } catch (e) {
      setError(e?.message || "Could not import that playlist.");
    } finally {
      setImportBusy(false);
    }
  }

  async function handleEnd() {
    setBusy(true);
    setError("");
    try {
      const winner = await endGroupChallenge(id);
      setWinnerUid(winner);
    } catch (e) {
      setError("Couldn't end the contest.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyNote(task) {
    const wordCount = userNote.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      setVerificationError("Please write at least 50 words before submitting.");
      setVerificationMessage("");
      return;
    }

    setVerificationBusy(true);
    setVerificationError("");
    setVerificationMessage("");

    try {
      const result = await verifyNote({
        videoTitle: task.videoTitle || task.title,
        userNote: userNote.trim(),
      });
      const verdict = String(result.verdict || "").toUpperCase();

      if (verdict === "PASS") {
        setQuizLoading(true);
        const quiz = await generateQuestions({ groupId: id, taskId: task.id, videoTitle: task.videoTitle || task.title });
        setQuizByTask((current) => ({ ...current, [task.id]: quiz.questions }));
        setQuizAnswers((current) => ({ ...current, [task.id]: [] }));
        setNoteTaskId(null);
        setUserNote("");
        setVerificationMessage("Notes verified. Answer all three questions to unlock the next video.");
      } else {
        setVerificationResults((current) => ({
          ...current,
          [task.id]: { verdict: "FAIL", reason: result.reason || "Notes could not be verified." },
        }));
        setVerificationError(result.reason || "Notes could not be verified. Please revise and try again.");
      }
    } catch (e) {
      setVerificationError(e?.message || "Verification failed. Please try again.");
      setVerificationMessage("");
    } finally {
      setVerificationBusy(false);
      setQuizLoading(false);
    }
  }

  async function handleQuizSubmit(task) {
    const answers = quizAnswers[task.id] || [];
    if (answers.length !== 3 || answers.some((answer) => answer === undefined)) return;
    setQuizLoading(true);
    setVerificationError("");
    try {
      const result = await verifyAnswers({ groupId: id, taskId: task.id, answers });
      setQuizResult({ taskId: task.id, ...result });
      if (result.passed) {
        await toggleContestTask(id, task.id, task.xp || 0);
        setVerificationResults((current) => ({
          ...current,
          [task.id]: { verdict: "PASS", reason: "Quiz passed." },
        }));
        setQuizByTask((current) => ({ ...current, [task.id]: null }));
        setVerificationMessage(`${result.correct}/${result.total} correct. Video complete and next video unlocked.`);
      } else {
        setVerificationError(`${result.correct}/${result.total} correct — need 70% to pass. Try the quiz again.`);
      }
    } catch (e) {
      setVerificationError(e?.message || "Quiz verification failed. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/contest")}>
        ← Back
      </button>

      <div>
        <h1 style={styles.title}>{contest.name}</h1>
        <p style={styles.subtitle}>
          {contest.subject} · {isEnded ? "ended" : contest.status} · {contest.members?.length || 0} members
        </p>
        {contest.inviteCode && (
          <p style={styles.inviteCode}>Invite code: {contest.inviteCode}</p>
        )}
      </div>

      {isEnded && (
        <div style={styles.winnerBanner}>
          🏆 Contest ended — winner declared, XP and badge updated.
        </div>
      )}

      {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
      {verificationMessage && <p className="pill pill-pass" style={styles.successMessage}>{verificationMessage}</p>}
      {verificationError && <p className="pill pill-fail" style={styles.errorMessage}>{verificationError}</p>}

      {/* FIX: Import button no longer depends on status === "waiting".
          It shows any time the admin has a playlist URL saved and no
          tasks/videos have been imported yet — even if the contest
          auto-flipped to "active" the moment this page loaded. */}
      {isAdmin && contest.playlistUrl && tasks.length === 0 && (
        <div style={styles.panel}>
          <p style={styles.panelLabel}>Import videos from your playlist</p>
          <button
            style={styles.outlineBtn}
            disabled={importBusy || busy}
            onClick={handleImportPlaylist}
          >
            {importBusy ? "Importing…" : "Import from playlist"}
          </button>
        </div>
      )}

      {isAdmin && contest.status === "waiting" && (
        <div style={styles.panel}>
          <p style={styles.panelLabel}>{contest.startDate || "No start date"} to {contest.endDate || "No end date"}</p>
          <p style={styles.panelLabel}>Add a task</p>
          <input
            style={styles.input}
            placeholder="e.g. Solve 5 LeetCode problems"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="XP value"
            value={taskXp}
            onChange={(e) => setTaskXp(e.target.value)}
          />
          <input
            style={styles.input}
            type="url"
            placeholder="YouTube link (optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <button style={styles.primaryBtn} disabled={busy} onClick={handleAddTask}>
            Add task
          </button>
          <button style={styles.primaryBtn} disabled={busy} onClick={handleStart}>
            Start challenge
          </button>
        </div>
      )}

      {isMember && <section className="card" style={styles.leaderboardPanel}>
        <div style={styles.leaderboardHeader}>
          <h2 style={styles.panelLabel}>Contest leaderboard</h2>
          <span style={{ color: "#4b5563", fontSize: 12 }}>{tasks.length} videos</span>
        </div>
        {leaderboardLoading ? (
          <span style={{ color: "#4b5563", fontSize: 13 }}>Loading...</span>
        ) : leaderboard.length === 0 ? (
          <span style={{ color: "#4b5563", fontSize: 13 }}>No members yet.</span>
        ) : (
          leaderboard.map((player, index) => (
            <div key={player.id} style={styles.leaderboardRow}>
              <strong style={{ color: "#a78bfa", width: 28 }}>#{index + 1}</strong>
              <span style={{ flex: 1, color: "#F0F4FF", fontSize: 14 }}>{player.name}</span>
              <span style={{ color: "#F0F4FF", fontSize: 12 }}>{player.videosDone}/{tasks.length}</span>
              <span style={{ color: "#4b5563", fontSize: 12 }}>{player.daysActive} days</span>
            </div>
          ))
        )}
      </section>}

      {isAdmin && contest.status === "active" && !isEnded && (
        <div style={styles.panel}>
          <p style={styles.panelLabel}>Contest in progress</p>
          <button style={styles.dangerBtn} disabled={busy} onClick={handleEnd}>
            {busy ? "Ending…" : "End contest"}
          </button>
        </div>
      )}

      {isMember && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.length === 0 ? (
          <p style={{ color: "#4b5563", fontSize: 14 }}>No tasks added yet.</p>
        ) : (
          tasks.map((task, index) => {
            const done = completedTaskIds.has(task.id) || verificationResults[task.id]?.verdict === "PASS";
            const isCurrent = index === firstUnlockedIndex;
            const isLocked = firstUnlockedIndex !== -1 && index > firstUnlockedIndex;
            const result = verificationResults[task.id];
            return (
              <div
                key={task.id}
                className="card"
                style={{
                  padding: 16,
                  background: done ? "rgba(139,92,246,0.08)" : "#160F26",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {task.thumbnail && <img src={task.thumbnail} alt="" style={styles.thumbnail} />}
                  <span style={{ flex: 1, color: done || isLocked ? "#4b5563" : "#F0F4FF", fontSize: 15 }}>
                    {task.videoUrl ? (
                      <a href={task.videoUrl} target="_blank" rel="noreferrer" style={styles.videoLink}>
                        {task.videoTitle || task.title}
                      </a>
                    ) : (
                      task.videoTitle || task.title
                    )}
                  </span>
                  <span className={`pill ${done ? "pill-pass" : isLocked ? "pill-locked" : result?.verdict === "FAIL" ? "pill-fail" : ""}`} style={{ color: done ? "#34d399" : isLocked ? "#4b5563" : result?.verdict === "FAIL" ? "#f87171" : "#818cf8", fontSize: 12, fontWeight: 600 }}>
                    {done ? "PASS" : isLocked ? "Locked" : result?.verdict === "FAIL" ? "FAIL" : `+${task.xp} XP`}
                  </span>
                </div>
                {isCurrent && !isEnded && (
                  <div style={{ marginTop: 12 }}>
                    {noteTaskId !== task.id ? (
                      <button className="btn btn-outline" style={styles.outlineBtn} onClick={() => {
                        setNoteTaskId(task.id);
                        setVerificationError("");
                        setVerificationMessage("");
                      }}>
                        Submit notes
                      </button>
                    ) : (
                      <div style={styles.notePanel}>
                        <textarea
                          className="card"
                          style={styles.textarea}
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          placeholder="Write at least 50 words about the video..."
                          rows={5}
                          disabled={verificationBusy}
                        />
                        <button className="btn" style={styles.primaryBtn} disabled={verificationBusy} onClick={() => handleVerifyNote(task)}>
                          {verificationBusy ? "Verifying…" : "Submit"}
                        </button>
                      </div>
                    )}
                    {quizLoading && quizByTask[task.id] === undefined && <p style={styles.subtitle}>Generating quiz…</p>}
                    {quizByTask[task.id] && (
                      <div style={styles.quizPanel}>
                        {quizByTask[task.id].map((question, questionIndex) => (
                          <fieldset key={question.question} style={styles.question}>
                            <legend style={styles.questionTitle}>{questionIndex + 1}. {question.question}</legend>
                            {question.options.map((option, optionIndex) => (
                              <label key={option} style={styles.option}>
                                <input type="radio" name={`${task.id}-${questionIndex}`} checked={quizAnswers[task.id]?.[questionIndex] === optionIndex} onChange={() => setQuizAnswers((current) => ({ ...current, [task.id]: current[task.id].map((answer, index) => index === questionIndex ? optionIndex : answer) }))} />
                                {option}
                              </label>
                            ))}
                          </fieldset>
                        ))}
                        <button style={styles.primaryBtn} disabled={quizLoading || (quizAnswers[task.id] || []).length !== 3 || quizAnswers[task.id].some((answer) => answer === undefined)} onClick={() => handleQuizSubmit(task)}>{quizLoading ? "Checking…" : "Submit quiz"}</button>
                      </div>
                    )}
                  </div>
                )}
                {result?.verdict === "FAIL" && result.reason && (
                  <p style={styles.failReason}>{result.reason}</p>
                )}
              </div>
            );
          })
        )}
      </div>}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0F0A1E",
    padding: "24px 20px 100px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  backBtn: {
    alignSelf: "flex-start",
    background: "transparent",
    border: "none",
    color: "#a78bfa",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
  },
  title: { color: "#F0F4FF", fontSize: 22, fontWeight: 700, margin: 0 },
  subtitle: { color: "#4b5563", fontSize: 13, margin: "4px 0 0" },
  inviteCode: { color: "#818cf8", fontSize: 13, margin: "6px 0 0", fontWeight: 600 },
  winnerBanner: {
    background: "rgba(139,92,246,0.12)",
    border: "1px solid rgba(139,92,246,0.35)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#F0F4FF",
    fontSize: 14,
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#160F26",
    border: "1px solid rgba(139,92,246,0.15)",
    borderRadius: 14,
    padding: 16,
  },
  panelLabel: { color: "#a78bfa", fontSize: 13, fontWeight: 600, margin: 0 },
  input: {
    background: "#0F0A1E",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#F0F4FF",
    fontSize: 14,
    outline: "none",
  },
  primaryBtn: {
    background: "#8b5cf6",
    border: "none",
    color: "#F0F4FF",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  outlineBtn: {
    background: "transparent",
    border: "1px solid rgba(139,92,246,0.3)",
    color: "#a78bfa",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  notePanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  textarea: {
    width: "100%",
    resize: "vertical",
    background: "#0F0A1E",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#F0F4FF",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  successMessage: { color: "#34d399", fontSize: 13, margin: 0 },
  errorMessage: { color: "#f87171", fontSize: 13, margin: 0 },
  failReason: { color: "#f87171", fontSize: 13, margin: "10px 0 0" },
  videoLink: { color: "#F0F4FF", textDecoration: "none" },
  thumbnail: { width: 72, height: 42, objectFit: "cover", borderRadius: 8, flexShrink: 0 },
  quizPanel: { display: "flex", flexDirection: "column", gap: 14, marginTop: 12, padding: 14, background: "#0F0A1E", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12 },
  question: { border: "1px solid rgba(139,92,246,0.15)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  questionTitle: { color: "#F0F4FF", fontSize: 14, fontWeight: 600, padding: "0 4px" },
  option: { display: "flex", alignItems: "flex-start", gap: 8, color: "#c4b5fd", fontSize: 13, lineHeight: 1.4 },
  leaderboardPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    background: "rgba(139,92,246,0.08)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 14,
  },
  leaderboardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  leaderboardRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid rgba(139,92,246,0.12)",
  },
  dangerBtn: {
    background: "transparent",
    border: "1px solid #f87171",
    color: "#f87171",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
