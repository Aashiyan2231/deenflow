import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------- Personal tasks ----------

export async function addPersonalTask({ title, xp }) {
  const uid = JSON.parse(localStorage.getItem("studybattle_user") || "{}").uid;
  if (!uid) throw new Error("Not logged in");
  await addDoc(collection(db, "users", uid, "personalMissions"), {
    title,
    xp,
    createdAt: serverTimestamp(),
  });
}

// ---------- Contests (groups) ----------

export async function createGroup({ name, subject, adminId, adminName, visibility = "private" }) {
  const inviteCode = generateInviteCode();
  const ref = await addDoc(collection(db, "groups"), {
    name,
    subject,
    inviteCode,
    adminId,
    adminName,
    members: [adminId],
    missions: { tasks: [] },
    status: "waiting",
    visibility, // "public" | "private"
    startDate: null,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "users", adminId), {
    groups: arrayUnion(ref.id),
  });

  return ref.id;
}

export async function joinGroupByCode(inviteCode, { uid, name }) {
  const q = query(collection(db, "groups"), where("inviteCode", "==", inviteCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Invalid invite code");

  const groupDoc = snap.docs[0];
  await updateDoc(doc(db, "groups", groupDoc.id), {
    members: arrayUnion(uid),
  });
  await updateDoc(doc(db, "users", uid), {
    groups: arrayUnion(groupDoc.id),
  });

  return groupDoc.id;
}

export async function addTaskToGroup(groupId, { title, xp }) {
  const ref = doc(db, "groups", groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Contest not found");

  const current = snap.data().missions?.tasks || [];
  const newTask = { id: `t_${Date.now()}`, title, xp };
  await updateDoc(ref, {
    missions: { tasks: [...current, newTask] },
  });
}

export async function startGroupChallenge(groupId) {
  await updateDoc(doc(db, "groups", groupId), {
    status: "active",
    startDate: serverTimestamp(),
  });
}

// Ends the contest and awards the winner (member with the most completed
// tasks across the contest's task list, counted via each member's
// completedMissions docs whose id contains this groupId).
export async function endGroupChallenge(groupId) {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) throw new Error("Contest not found");

  const group = groupSnap.data();
  const members = group.members || [];

  let winnerUid = null;
  let bestCount = -1;

  for (const memberUid of members) {
    const completionsSnap = await getDocs(
      collection(db, "users", memberUid, "completedMissions")
    );
    const count = completionsSnap.docs.filter((d) =>
      d.id.includes(`_${groupId}_`)
    ).length;

    if (count > bestCount) {
      bestCount = count;
      winnerUid = memberUid;
    }
  }

  await updateDoc(groupRef, {
    status: "ended",
    winnerUid: winnerUid || null,
  });

  if (winnerUid) {
    await updateDoc(doc(db, "users", winnerUid), {
      contestsWon: increment(1),
    });
  }

  return winnerUid;
}

// ---------- Discovery (public contests) ----------

export async function getPublicContests() {
  const q = query(collection(db, "groups"), where("visibility", "==", "public"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function joinPublicContest(groupId, { uid, name }) {
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayUnion(uid),
  });
  await updateDoc(doc(db, "users", uid), {
    groups: arrayUnion(groupId),
  });
}

// ---------- Friends ----------

export async function getUserById(id) {
  const snap = await getDoc(doc(db, "users", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Looks up a user by their friendCode and sends them a friend request.
export async function sendFriendRequest(currentUser, friendCode) {
  if (friendCode === currentUser.friendCode) {
    return { error: "That's your own code." };
  }

  const q = query(collection(db, "users"), where("friendCode", "==", friendCode));
  const snap = await getDocs(q);
  if (snap.empty) {
    return { error: "No user found with that code." };
  }

  const targetDoc = snap.docs[0];
  const targetData = targetDoc.data();

  if ((targetData.friends || []).includes(currentUser.uid)) {
    return { error: "You're already friends." };
  }
  if ((targetData.receivedRequests || []).includes(currentUser.uid)) {
    return { error: "Request already sent." };
  }

  await updateDoc(doc(db, "users", targetDoc.id), {
    receivedRequests: arrayUnion(currentUser.uid),
  });

  return { success: "Friend request sent!" };
}

export async function acceptFriendRequest(uid, friendId) {
  await updateDoc(doc(db, "users", uid), {
    friends: arrayUnion(friendId),
    receivedRequests: arrayRemove(friendId),
  });
  await updateDoc(doc(db, "users", friendId), {
    friends: arrayUnion(uid),
  });
}

export async function declineFriendRequest(uid, friendId) {
  await updateDoc(doc(db, "users", uid), {
    receivedRequests: arrayRemove(friendId),
  });
}