import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  documentId,
  endAt,
  onSnapshot,
  orderBy,
  query,
  startAt,
  updateDoc,
  where,
  increment,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// completedMissions doc IDs look like: "2026-09-13_personal_<taskId>"
// or "2026-09-13_<groupId>_<taskId>" for contest tasks.
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function personalCompletionId(taskId) {
  return `${todayKey()}_personal_${taskId}`;
}
function contestCompletionId(groupId, taskId) {
  return `${todayKey()}_${groupId}_${taskId}`;
}
function prefixRange(prefix) {
  return { start: prefix, end: prefix + "\uf8ff" };
}

export function useUser() {
  const { user } = useAuth(); // expects { uid, name }
  const uid = user?.uid;

  const [userDoc, setUserDoc] = useState(null);
  const [personalTasksRaw, setPersonalTasksRaw] = useState([]);
  const [completedIdsToday, setCompletedIdsToday] = useState(new Set());
  const [completedCountTotal, setCompletedCountTotal] = useState(0);
  const [groupsById, setGroupsById] = useState({});
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingContests, setLoadingContests] = useState(true);

  // --- user doc (xp, level, streak, groups[], contestsWon, friends, etc.) ---
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null);
      setLoadingUser(false);
    });
    return unsub;
  }, [uid]);

  // --- personal task definitions ---
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, "users", uid, "personalMissions"),
      (snap) => {
        setPersonalTasksRaw(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
        setLoadingTasks(false);
      }
    );
    return unsub;
  }, [uid]);

  // --- today's completions (personal + contest), via doc-id prefix range ---
  useEffect(() => {
    if (!uid) return;
    const { start, end } = prefixRange(todayKey());
    const q = query(
      collection(db, "users", uid, "completedMissions"),
      orderBy(documentId()),
      startAt(start),
      endAt(end)
    );
    const unsub = onSnapshot(q, (snap) => {
      setCompletedIdsToday(new Set(snap.docs.map((d) => d.id)));
    });
    return unsub;
  }, [uid]);

  // --- all-time completed task count (for badges like "Centurion") ---
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, "users", uid, "completedMissions"),
      (snap) => {
        setCompletedCountTotal(snap.size);
      }
    );
    return unsub;
  }, [uid]);

  // --- joined contests (groups the user belongs to) ---
  useEffect(() => {
    const groupIds = userDoc?.groups || [];
    if (groupIds.length === 0) {
      setGroupsById({});
      setLoadingContests(false);
      return;
    }
    // Firestore 'in' queries cap at 10 — fine while contest counts are small
    const q = query(
      collection(db, "groups"),
      where(documentId(), "in", groupIds.slice(0, 10))
    );
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = { id: d.id, ...d.data() };
      });
      setGroupsById(map);
      setLoadingContests(false);
    });
    return unsub;
  }, [userDoc?.groups]);

  // --- derived: personal tasks with done state ---
  const personalTasks = useMemo(
    () =>
      personalTasksRaw.map((t) => ({
        ...t,
        done: completedIdsToday.has(personalCompletionId(t.id)),
      })),
    [personalTasksRaw, completedIdsToday]
  );

  // --- derived: active contests with today's progress ---
  const activeContests = useMemo(() => {
    return Object.values(groupsById)
      .filter((g) => g.status === "active")
      .map((g) => {
        const tasks = g.missions?.tasks || [];
        const completed = tasks.filter((t) =>
          completedIdsToday.has(contestCompletionId(g.id, t.id))
        ).length;
        return {
          id: g.id,
          name: g.name,
          subject: g.subject,
          status: g.status,
          members: g.members,
          adminName: g.adminName,
          adminId: g.adminId,
          inviteCode: g.inviteCode,
          tasks,
          missions: g.missions,
          completed,
          total: tasks.length,
          completedTaskIds: tasks
            .filter((t) => completedIdsToday.has(contestCompletionId(g.id, t.id)))
            .map((t) => t.id),
        };
      });
  }, [groupsById, completedIdsToday]);

  // all joined contests, any status — used by the Contests list page
  const contests = useMemo(
    () =>
      Object.values(groupsById).map((g) => ({
        id: g.id,
        name: g.name,
        subject: g.subject,
        status: g.status,
        members: g.members,
        adminName: g.adminName,
        adminId: g.adminId,
        inviteCode: g.inviteCode,
        tasks: g.missions?.tasks || [],
        missions: g.missions,
      })),
    [groupsById]
  );

  // --- toggle a personal task done/undone, adjusting XP ---
  async function toggleTask(taskId) {
    if (!uid) return;
    const task = personalTasksRaw.find((t) => t.id === taskId);
    if (!task) return;

    const completionId = personalCompletionId(taskId);
    const alreadyDone = completedIdsToday.has(completionId);
    const completionRef = doc(db, "users", uid, "completedMissions", completionId);
    const userRef = doc(db, "users", uid);

    if (alreadyDone) {
      await deleteDoc(completionRef);
      await updateDoc(userRef, { xp: increment(-(task.xp || 0)) });
    } else {
      await setDoc(completionRef, {
        taskId,
        source: "personal",
        completedAt: new Date().toISOString(),
      });
      await updateDoc(userRef, { xp: increment(task.xp || 0) });
    }
  }

  // --- toggle a contest task done/undone ---
  async function toggleContestTask(groupId, taskId, xpValue = 0) {
    if (!uid) return;
    const completionId = contestCompletionId(groupId, taskId);
    const alreadyDone = completedIdsToday.has(completionId);
    const completionRef = doc(db, "users", uid, "completedMissions", completionId);
    const userRef = doc(db, "users", uid);

    if (alreadyDone) {
      await deleteDoc(completionRef);
      await updateDoc(userRef, { xp: increment(-xpValue) });
    } else {
      await setDoc(completionRef, {
        taskId,
        source: groupId,
        completedAt: new Date().toISOString(),
      });
      await updateDoc(userRef, { xp: increment(xpValue) });
    }
  }

  // --- combined raw-ish object for pages that expect `userData` (e.g. Profile.jsx) ---
  const userData = useMemo(() => {
    if (!uid || loadingUser) return null;
    return {
      uid,
      xp: 0,
      level: 1,
      streak: 0,
      friendCode: null,
      friends: [],
      receivedRequests: [],
      groups: [],
      contestsWon: 0,
      ...userDoc,
    };
  }, [uid, loadingUser, userDoc]);

  return {
    xp: userDoc?.xp || 0,
    level: userDoc?.level || 1,
    streak: userDoc?.streak || 0,
    friendCode: userDoc?.friendCode || null,
    friends: userDoc?.friends || [],
    // contestsWon is a manual counter on the user doc for now — see note below
    contestsWon: userDoc?.contestsWon || 0,
    tasksCompletedTotal: completedCountTotal,
    personalTasks,
    activeContests,
    contests,
    toggleTask,
    toggleContestTask,
    // combined object for pages expecting `userData` (e.g. Profile.jsx)
    userData,
    loading: loadingUser || loadingTasks || loadingContests,
  };
}